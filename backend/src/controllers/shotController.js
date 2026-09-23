const ShotMetric = require('../models/ShotMetric');
const Session = require('../models/Session');
const { isConnected, memoryStore } = require('../config/db');

exports.logShot = async (req, res) => {
  try {
    const data = req.body;
    if (isConnected()) {
      const shot = await ShotMetric.create(data);
      if (data.sessionId) {
        // Update session totals
        const isMade = data.outcome === 'Made';
        await Session.findByIdAndUpdate(data.sessionId, {
          $inc: {
            totalShots: 1,
            madeShots: isMade ? 1 : 0,
            missedShots: isMade ? 0 : 1,
            illegalExtensions: data.isIllegalExtension ? 1 : 0
          }
        });
      }
      return res.status(201).json(shot);
    }

    const shot = {
      _id: `shot_${Date.now()}`,
      sessionId: data.sessionId || 'sess_demo_002',
      shotNumber: data.shotNumber || (memoryStore.shots.length + 1),
      outcome: data.outcome || 'Made',
      releaseAngle: data.releaseAngle || 160.0,
      elbowExtensionDelta: data.elbowExtensionDelta || 6.5,
      kneeTimingSync: data.kneeTimingSync || 90.0,
      performanceIndex: data.performanceIndex || 85.0,
      isIllegalExtension: data.isIllegalExtension || false,
      confidence: data.confidence || 0.92,
      timestamp: new Date().toISOString()
    };
    memoryStore.shots.push(shot);

    const sess = memoryStore.sessions.find(s => s._id === shot.sessionId);
    if (sess) {
      sess.totalShots += 1;
      if (shot.outcome === 'Made') sess.madeShots += 1;
      else sess.missedShots += 1;
      sess.accuracyPercentage = Math.round((sess.madeShots / sess.totalShots) * 1000) / 10;
      if (shot.isIllegalExtension) sess.illegalExtensions += 1;
    }

    return res.status(201).json(shot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getShotsBySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (isConnected()) {
      const shots = await ShotMetric.find({ sessionId }).sort({ shotNumber: 1 });
      return res.json(shots);
    }

    const shots = memoryStore.shots.filter(s => s.sessionId === sessionId);
    return res.json(shots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

