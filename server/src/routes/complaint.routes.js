const express = require('express');
const router = express.Router();
const {
  startComplaint,
  addSymptoms,
  addUserSeverity,
  submitNaranjo,
  getMyComplaints,
} = require('../controllers/complaint.controller');
const { protect } = require('../middleware/auth.middleware');

// All complaint routes require authentication
router.use(protect);

router.post('/start', startComplaint);
router.get('/my', getMyComplaints);
router.post('/:id/symptoms', addSymptoms);
router.post('/:id/user-severity', addUserSeverity);
router.post('/:id/naranjo', submitNaranjo);

module.exports = router;
