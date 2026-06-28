const Complaint = require('../models/Complaint.model');
const { calculatePRR } = require('../utils/prr.calculator');

// ─────────────────────────────────────────────────────────────
// GET /api/admin/complaints
// Triage queue: all non-Incomplete complaints, sorted by severity
// ─────────────────────────────────────────────────────────────
const getTriageQueue = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ status: { $ne: 'Incomplete' } })
      .populate('userId', 'name email')
      .sort({ totalIssueScore: -1, createdAt: -1 });

    // Annotate triage bucket
    const annotated = complaints.map((c) => {
      let triageBucket;
      const score = c.totalIssueScore || 0;
      if (score >= 8) triageBucket = 'Urgent Issue';
      else if (score >= 4) triageBucket = 'Queue for Assistance';
      else triageBucket = 'Routine Log';

      return { ...c.toObject(), triageBucket };
    });

    return res.status(200).json({ success: true, count: annotated.length, data: annotated });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/complaints/:id
// Full case detail
// ─────────────────────────────────────────────────────────────
const getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('userId', 'name email');
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }
    return res.status(200).json({ success: true, data: complaint });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// PUT /api/admin/complaints/:id/status
// Update case status (validate, resolve, etc.)
// ─────────────────────────────────────────────────────────────
const updateComplaintStatus = async (req, res, next) => {
  const { status, adminNotes, adminValidated } = req.body;

  const allowedStatuses = ['Incomplete', 'Queued for Review', 'Urgent Issue', 'Resolved'];
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status value' });
  }

  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    if (status) complaint.status = status;
    if (adminNotes !== undefined) complaint.adminNotes = adminNotes;
    if (adminValidated !== undefined) complaint.adminValidated = Boolean(adminValidated);

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: 'Case updated',
      data: complaint,
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/duplicates/:medicineName
// Find potential duplicate reports (same drug + same MedDRA term)
// ─────────────────────────────────────────────────────────────
const checkDuplicates = async (req, res, next) => {
  try {
    const { medicineName } = req.params;

    const groups = await Complaint.aggregate([
      {
        $match: {
          medicineName: new RegExp(medicineName, 'i'),
          status: { $ne: 'Incomplete' },
        },
      },
      {
        $group: {
          _id: { medicineName: '$medicineName', meddraTerm: '$meddraTerm' },
          count: { $sum: 1 },
          complaints: { $push: '$_id' },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return res.status(200).json({
      success: true,
      duplicateGroups: groups.length,
      data: groups,
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/analytics/medicine?name=X
// Medicine analytics: total count + MedDRA term breakdown for charts
// ─────────────────────────────────────────────────────────────
const getMedicineAnalytics = async (req, res, next) => {
  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Medicine name query param required' });
  }

  try {
    const filter = {
      medicineName: new RegExp(name.trim(), 'i'),
      status: { $ne: 'Incomplete' },
    };

    const total = await Complaint.countDocuments(filter);

    // Bar chart data: MedDRA term → count
    const termBreakdown = await Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$meddraTerm', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    // Severity distribution
    const severityData = await Complaint.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgSeverity: { $avg: '$totalIssueScore' },
          maxSeverity: { $max: '$totalIssueScore' },
          minSeverity: { $min: '$totalIssueScore' },
        },
      },
    ]);

    // Sorted complaint list for the table
    const complaints = await Complaint.find(filter)
      .populate('userId', 'name email')
      .sort({ totalIssueScore: -1 });

    return res.status(200).json({
      success: true,
      data: {
        medicineName: name,
        totalComplaints: total,
        chartData: termBreakdown.map((t) => ({
          name: t._id || 'Unknown',
          count: t.count,
        })),
        severityStats: severityData[0] || { avgSeverity: 0, maxSeverity: 0, minSeverity: 0 },
        complaints,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/signals/prr?drug=X&event=Y
// PRR + Chi-Square signal detection
// ─────────────────────────────────────────────────────────────
const getSignalPRR = async (req, res, next) => {
  const { drug, event } = req.query;

  if (!drug || !event) {
    return res.status(400).json({
      success: false,
      message: 'Both drug and event query params are required',
    });
  }

  try {
    const result = await calculatePRR(drug, event);
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/admin/stats
// Dashboard summary stats
// ─────────────────────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const total = await Complaint.countDocuments({ status: { $ne: 'Incomplete' } });
    const urgent = await Complaint.countDocuments({ status: 'Urgent Issue' });
    const queued = await Complaint.countDocuments({ status: 'Queued for Review' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });

    // Top 5 drugs by complaint count
    const topDrugs = await Complaint.aggregate([
      { $match: { status: { $ne: 'Incomplete' } } },
      { $group: { _id: '$medicineName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        total,
        urgent,
        queued,
        resolved,
        topDrugs: topDrugs.map((d) => ({ name: d._id, count: d.count })),
      },
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getTriageQueue,
  getComplaintById,
  updateComplaintStatus,
  checkDuplicates,
  getMedicineAnalytics,
  getSignalPRR,
  getDashboardStats,
};
