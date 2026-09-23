const Session = require('../models/Session');
const ShotMetric = require('../models/ShotMetric');
const { isConnected, memoryStore } = require('../config/db');

exports.getSessions = async (req, res) => {
  try {
    if (isConnected()) {
      const sessions = await Session.find().sort({ createdAt: -1 });
      return res.json(sessions);
    }
    return res.json(memoryStore.sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (isConnected()) {
      const session = await Session.findById(id);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      const shots = await ShotMetric.find({ sessionId: id }).sort({ shotNumber: 1 });
      return res.json({ session, shots });
    }

    const session = memoryStore.sessions.find(s => s._id === id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const shots = memoryStore.shots.filter(s => s.sessionId === id);
    return res.json({ session, shots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSession = async (req, res) => {
  try {
    const data = req.body;
    if (isConnected()) {
      const session = await Session.create(data);
      return res.status(201).json(session);
    }

    const session = {
      _id: `sess_${Date.now()}`,
      userId: req.user?.id || 'usr_demo_101',
      title: data.title || 'Live Training Session',
      sport: data.sport || 'basketball',
      dominantSide: data.dominantSide || 'right',
      totalShots: data.totalShots || 0,
      madeShots: data.madeShots || 0,
      missedShots: data.missedShots || 0,
      accuracyPercentage: data.accuracyPercentage || 0,
      performanceIndex: data.performanceIndex || 0,
      grade: data.grade || 'COMPETENT',
      illegalExtensions: data.illegalExtensions || 0,
      durationSeconds: data.durationSeconds || 0,
      summary: data.summary || {
        accuracyScore: data.accuracyPercentage || 0,
        elbowStabilityScore: 85.0,
        kneeTimingScore: 88.0,
        coachingFeedback: ["Session logged successfully."]
      },
      createdAt: new Date().toISOString()
    };
    memoryStore.sessions.unshift(session);
    return res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const { id } = req.params;
    if (isConnected()) {
      await Session.findByIdAndDelete(id);
      await ShotMetric.deleteMany({ sessionId: id });
      return res.json({ success: true, message: 'Session deleted' });
    }

    const idx = memoryStore.sessions.findIndex(s => s._id === id);
    if (idx !== -1) memoryStore.sessions.splice(idx, 1);
    memoryStore.shots = memoryStore.shots.filter(s => s.sessionId !== id);
    return res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

