const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  title: {
    type: String,
    required: true,
    default: 'Training Session'
  },
  sport: {
    type: String,
    enum: ['basketball', 'cricket_bowling', 'tennis_serve', 'football'],
    default: 'basketball'
  },
  dominantSide: {
    type: String,
    enum: ['right', 'left'],
    default: 'right'
  },
  totalShots: {
    type: Number,
    default: 0
  },
  madeShots: {
    type: Number,
    default: 0
  },
  missedShots: {
    type: Number,
    default: 0
  },
  accuracyPercentage: {
    type: Number,
    default: 0.0
  },
  performanceIndex: {
    type: Number,
    default: 0.0
  },
  grade: {
    type: String,
    enum: ['ELITE', 'PRO', 'COMPETENT', 'DEVELOPING', 'NEEDS_REFINEMENT'],
    default: 'COMPETENT'
  },
  illegalExtensions: {
    type: Number,
    default: 0
  },
  durationSeconds: {
    type: Number,
    default: 0
  },
  videoUrl: {
    type: String,
    default: ''
  },
  summary: {
    accuracyScore: { type: Number, default: 0 },
    elbowStabilityScore: { type: Number, default: 0 },
    kneeTimingScore: { type: Number, default: 0 },
    coachingFeedback: [{ type: String }]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Session', SessionSchema);

