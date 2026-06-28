const Complaint = require('../models/Complaint.model');
const { mapSymptomToMedDRA } = require('../utils/huggingface.service');
const { calculateNaranjoScore } = require('../utils/naranjo.engine');

// ─────────────────────────────────────────────────────────────
// Helper: derive triage status from totalIssueScore
// ─────────────────────────────────────────────────────────────
function deriveStatus(totalScore) {
  if (totalScore >= 8) return 'Urgent Issue';
  if (totalScore >= 4) return 'Queued for Review';
  return 'Queued for Review'; // even low-severity gets queued once submitted
}

// ─────────────────────────────────────────────────────────────
// POST /api/complaints/start
// Step 1: Create a new Incomplete complaint with medicine info
// ─────────────────────────────────────────────────────────────
const startComplaint = async (req, res, next) => {
  const { medicineName, companyName } = req.body;

  if (!medicineName || !companyName) {
    return res.status(400).json({
      success: false,
      message: 'Medicine name and company name are required',
    });
  }

  try {
    const complaint = await Complaint.create({
      userId: req.user._id,
      medicineName: medicineName.trim(),
      companyName: companyName.trim(),
      status: 'Incomplete',
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint started',
      data: { complaintId: complaint._id },
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/complaints/:id/symptoms
// Step 2: Add symptom description, call HF API, return result
// ─────────────────────────────────────────────────────────────
const addSymptoms = async (req, res, next) => {
  const { rawSymptomDescription, daysFeelingIll } = req.body;

  if (!rawSymptomDescription || daysFeelingIll === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Symptom description and days feeling ill are required',
    });
  }

  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Call Hugging Face API
    let meddraTerm, apiSeverityScore;
    try {
      const result = await mapSymptomToMedDRA(rawSymptomDescription);
      meddraTerm = result.meddraTerm;
      apiSeverityScore = result.severityScore;
    } catch (apiError) {
      // Graceful degradation — don't block the user, use fallback
      console.error('HF API error:', apiError.message);
      meddraTerm = 'Adverse Event (Unclassified)';
      apiSeverityScore = 5; // neutral fallback
    }

    complaint.rawSymptomDescription = rawSymptomDescription.trim();
    complaint.daysFeelingIll = Number(daysFeelingIll);
    complaint.meddraTerm = meddraTerm;
    complaint.apiSeverityScore = apiSeverityScore;

    await complaint.save();

    const needsUserScore = apiSeverityScore < 5;

    return res.status(200).json({
      success: true,
      message: 'Symptoms recorded',
      data: {
        complaintId: complaint._id,
        meddraTerm,
        apiSeverityScore,
        needsUserScore,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/complaints/:id/user-severity
// Step 2b: Save user's self-reported severity score (conditional)
// ─────────────────────────────────────────────────────────────
const addUserSeverity = async (req, res, next) => {
  const { userSeverityScore } = req.body;

  if (userSeverityScore === undefined || userSeverityScore < 1 || userSeverityScore > 10) {
    return res.status(400).json({
      success: false,
      message: 'User severity score must be between 1 and 10',
    });
  }

  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.userSeverityScore = Number(userSeverityScore);
    await complaint.save();

    return res.status(200).json({
      success: true,
      message: 'User severity recorded',
      data: { complaintId: complaint._id, userSeverityScore: complaint.userSeverityScore },
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/complaints/:id/naranjo
// Step 3: Receive 4 Naranjo answers, run engine, finalize complaint
// ─────────────────────────────────────────────────────────────
const submitNaranjo = async (req, res, next) => {
  const { q1, q2, q3, q4 } = req.body;

  const validAnswers = ['yes', 'no', 'unknown'];
  for (const [key, val] of Object.entries({ q1, q2, q3, q4 })) {
    if (!validAnswers.includes((val || '').toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid answer for ${key}. Must be 'yes', 'no', or 'unknown'`,
      });
    }
  }

  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const answers = { q1, q2, q3, q4 };
    const { causalityScore, causalityCategory } = calculateNaranjoScore(answers);

    // Compute composite triage score
    const apiScore = complaint.apiSeverityScore || 5;
    const userScore = complaint.userSeverityScore || 0;
    const totalIssueScore = Math.max(apiScore, userScore);

    complaint.naranjoAnswers = answers;
    complaint.causalityScore = causalityScore;
    complaint.causalityCategory = causalityCategory;
    complaint.totalIssueScore = totalIssueScore;
    complaint.status = deriveStatus(totalIssueScore);

    await complaint.save();

    return res.status(200).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: {
        complaintId: complaint._id,
        causalityScore,
        causalityCategory,
        totalIssueScore,
        status: complaint.status,
        medicineName: complaint.medicineName,
        meddraTerm: complaint.meddraTerm,
      },
    });
  } catch (err) {
    return next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/complaints/my
// Patient: list own complaints
// ─────────────────────────────────────────────────────────────
const getMyComplaints = async (req, res, next) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: complaints });
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  startComplaint,
  addSymptoms,
  addUserSeverity,
  submitNaranjo,
  getMyComplaints,
};
