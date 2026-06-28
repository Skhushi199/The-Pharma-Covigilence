const express = require('express');
const router = express.Router();
const {
  getTriageQueue,
  getComplaintById,
  updateComplaintStatus,
  checkDuplicates,
  getMedicineAnalytics,
  getSignalPRR,
  getDashboardStats,
} = require('../controllers/admin.controller');
const { protect, requireAdmin } = require('../middleware/auth.middleware');

// All admin routes require auth + admin role
router.use(protect, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/complaints', getTriageQueue);
router.get('/complaints/:id', getComplaintById);
router.put('/complaints/:id/status', updateComplaintStatus);
router.get('/duplicates/:medicineName', checkDuplicates);
router.get('/analytics/medicine', getMedicineAnalytics);
router.get('/signals/prr', getSignalPRR);

module.exports = router;
