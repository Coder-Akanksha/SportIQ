const path = require('path');
const PythonVisionBridge = require('../services/pythonBridge');
const Session = require('../models/Session');
const ShotMetric = require('../models/ShotMetric');
const { isConnected, memoryStore } = require('../config/db');

exports.processFrame = async (req, res) => {
  try {
    const { imageBase64, frameIndex, sportType, dominantSide } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 required' });
    }

    const result = await PythonVisionBridge.analyzeFrame(
      imageBase64,
      frameIndex || 0,
      sportType || 'basketball',
      dominantSide || 'right'
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadAndAnalyzeVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const sportType = req.body.sportType || 'basketball';
    const dominantSide = req.body.dominantSide || 'right';
    const filePath = req.file.path;

    console.log(`[Vision API] Processing uploaded video: ${req.file.originalname} (${req.file.size} bytes)...`);
    const analysis = await PythonVisionBridge.analyzeVideoFile(filePath, sportType, dominantSide);

    // Save session automatically into DB/MemoryStore
    const summary = analysis.summary || {};
    const shotSummary = summary.shot_summary || {};
    const pi = summary.final_performance_index || {};

    const sessionData = {
      title: `${sportType.toUpperCase()} Video Analysis: ${path.basename(req.file.originalname, path.extname(req.file.originalname))}`,
      sport: sportType,
      dominantSide: dominantSide,
      totalShots: shotSummary.total_shots || 0,
      madeShots: shotSummary.made_shots || 0,
      missedShots: shotSummary.missed_shots || 0,
      accuracyPercentage: shotSummary.accuracy_percentage || 0,
      performanceIndex: pi.overall_pi || 80.0,
      grade: pi.grade || 'PRO',
      illegalExtensions: summary.illegal_extensions_detected || 0,
      durationSeconds: summary.duration_seconds || 10,
      videoUrl: `/uploads/${req.file.filename}`,
      summary: {
        accuracyScore: pi.accuracy_score || shotSummary.accuracy_percentage || 0,
        elbowStabilityScore: pi.elbow_stability_score || 85.0,
        kneeTimingScore: pi.knee_timing_score || 88.0,
        coachingFeedback: pi.coaching_insights || ["Video analysis complete."]
      }
    };

    let savedSession;
    if (isConnected()) {
      savedSession = await Session.create(sessionData);
      
      // Save individual shots
      if (shotSummary.recent_shots && shotSummary.recent_shots.length > 0) {
        for (const s of shotSummary.recent_shots) {
          await ShotMetric.create({
            sessionId: savedSession._id,
            shotNumber: s.shot_id,
            outcome: s.outcome,
            releaseAngle: s.release_angle,
            elbowExtensionDelta: s.extension_delta || 0,
            kneeTimingSync: 88.0,
            performanceIndex: pi.overall_pi || 80.0,
            isIllegalExtension: (s.extension_delta || 0) > 15.0
          });
        }
      }
    } else {
      savedSession = {
        _id: `sess_vid_${Date.now()}`,
        ...sessionData,
        createdAt: new Date().toISOString()
      };
      memoryStore.sessions.unshift(savedSession);
    }

    res.json({
      success: true,
      session: savedSession,
      analysis: summary,
      annotatedVideoUrl: analysis.annotated_video_url || `/uploads/${req.file.filename}`
    });
  } catch (error) {
    console.error('Video upload processing failed:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.computeKinematics = async (req, res) => {
  try {
    const { shoulder, elbow, wrist, hip, knee, ankle } = req.body;
    if (!shoulder || !elbow || !wrist) {
      return res.status(400).json({ error: 'shoulder, elbow, and wrist 3D coordinates required' });
    }

    const result = await PythonVisionBridge.computeKinematics(shoulder, elbow, wrist, hip, knee, ankle);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getServiceHealth = async (req, res) => {
  try {
    const health = await PythonVisionBridge.checkHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ online: false, error: error.message });
  }
};

