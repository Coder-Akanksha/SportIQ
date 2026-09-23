const mongoose = require('mongoose');

const BiomechanicsLogSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: false
  },
  frameIndex: {
    type: Number,
    required: true
  },
  timestampMs: {
    type: Number,
    required: true
  },
  elbowAngle: {
    type: Number,
    required: true
  },
  kneeAngle: {
    type: Number,
    default: 170.0
  },
  extensionDelta: {
    type: Number,
    default: 0.0
  },
  armState: {
    type: String,
    default: 'REST'
  },
  isIllegalExtension: {
    type: Boolean,
    default: false
  },
  kineticVelocities: {
    knee: Number,
    elbow: Number,
    wrist: Number
  }
});

module.exports = mongoose.model('BiomechanicsLog', BiomechanicsLogSchema);

