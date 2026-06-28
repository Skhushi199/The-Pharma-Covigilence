const mongoose = require('mongoose');

const naranjoAnswersSchema = new mongoose.Schema(
  {
    q1: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
    q2: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
    q3: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
    q4: { type: String, enum: ['yes', 'no', 'unknown'], default: 'unknown' },
  },
  { _id: false }
);

const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Step 1 — Medicine Info
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    // Step 2 — Symptom Info
    rawSymptomDescription: {
      type: String,
      trim: true,
    },
    daysFeelingIll: {
      type: Number,
      min: 0,
    },

    // From HF API
    meddraTerm: {
      type: String,
      trim: true,
    },
    apiSeverityScore: {
      type: Number,
      min: 1,
      max: 10,
    },

    // Collected from user only if apiSeverityScore < 5
    userSeverityScore: {
      type: Number,
      min: 1,
      max: 10,
      default: null,
    },

    // Composite triage score = max(apiScore, userScore)
    totalIssueScore: {
      type: Number,
      min: 1,
      max: 10,
    },

    // Step 3 — Naranjo Causality
    naranjoAnswers: {
      type: naranjoAnswersSchema,
      default: () => ({}),
    },
    causalityScore: {
      type: Number,
    },
    causalityCategory: {
      type: String,
      enum: ['Probable', 'Possible', 'Doubtful'],
    },

    // Workflow status
    status: {
      type: String,
      enum: ['Incomplete', 'Queued for Review', 'Urgent Issue', 'Resolved'],
      default: 'Incomplete',
    },

    // Admin notes / validation flag
    adminValidated: {
      type: Boolean,
      default: false,
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Index for fast admin queries
complaintSchema.index({ medicineName: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ totalIssueScore: -1 });
complaintSchema.index({ meddraTerm: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
