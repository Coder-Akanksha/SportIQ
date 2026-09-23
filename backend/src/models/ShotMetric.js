const mongoose = require('mongoose');

const ShotMetricSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: false
  },
  shotNumber: {
    type: Number,
    required: true
  },
  outcome: {
    type: String,
    enum: ['Made', 'Missed'],
    required: true
  },
  releaseAngle: {
    type: Number,
    required: true
  },
  elbowExtensionDelta: {
    type: Number,
    default: 0.0
  },
  kneeTimingSync: {
    type: Number,
    default: 85.0
  },
  performanceIndex: {
    type: Number,
    default: 75.0
  },
  isIllegalExtension: {
    type: Boolean,
    default: false
  },
  confidence: {
    type: Number,
    default: 0.90
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ShotMetric', ShotMetricSchema);

