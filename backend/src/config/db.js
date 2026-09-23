const mongoose = require('mongoose');

// Global fallback in-memory store for environments without MongoDB running
const memoryStore = {
  users: [
    {
      _id: "usr_demo_101",
      name: "Alex Mercer",
      email: "alex.player@sporttrack.ai",
      role: "player",
      sport: "basketball",
      dominantSide: "right",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      targetElbowAngle: 160.0,
      createdAt: new Date().toISOString()
    }
  ],
  sessions: [
    {
      _id: "sess_demo_001",
      userId: "usr_demo_101",
      title: "Championship Jump Shot Drill",
      sport: "basketball",
      dominantSide: "right",
      totalShots: 25,
      madeShots: 19,
      missedShots: 6,
      accuracyPercentage: 76.0,
      performanceIndex: 84.5,
      grade: "PRO",
      illegalExtensions: 1,
      durationSeconds: 940,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      summary: {
        accuracyScore: 76.0,
        elbowStabilityScore: 88.0,
        kneeTimingScore: 91.0,
        coachingFeedback: [
          "[SUCCESS] Excellent set-point height and kinetic energy transfer.",
          "[TIMING] Knee extension peak matched arm release within 80ms corridor."
        ]
      }
    },
    {
      _id: "sess_demo_002",
      userId: "usr_demo_101",
      title: "Corner Three-Point Baseline",
      sport: "basketball",
      dominantSide: "right",
      totalShots: 30,
      madeShots: 24,
      missedShots: 6,
      accuracyPercentage: 80.0,
      performanceIndex: 89.2,
      grade: "PRO",
      illegalExtensions: 0,
      durationSeconds: 1120,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      summary: {
        accuracyScore: 80.0,
        elbowStabilityScore: 92.5,
        kneeTimingScore: 94.0,
        coachingFeedback: [
          "[SUCCESS] Flawless legal follow-through with zero elbow flare.",
          "[SYNC] Kinetic chain sequence: Knee (t=0ms) -> Hip (t=45ms) -> Shoulder (t=90ms) -> Wrist (t=140ms)."
        ]
      }
    }
  ],
  shots: [
    {
      _id: "shot_1",
      sessionId: "sess_demo_002",
      shotNumber: 1,
      outcome: "Made",
      releaseAngle: 158.4,
      elbowExtensionDelta: 6.2,
      kneeTimingSync: 92.0,
      performanceIndex: 88.0,
      isIllegalExtension: false,
      timestamp: new Date(Date.now() - 86400000 + 15000).toISOString()
    },
    {
      _id: "shot_2",
      sessionId: "sess_demo_002",
      shotNumber: 2,
      outcome: "Made",
      releaseAngle: 161.0,
      elbowExtensionDelta: 7.0,
      kneeTimingSync: 94.5,
      performanceIndex: 91.2,
      isIllegalExtension: false,
      timestamp: new Date(Date.now() - 86400000 + 35000).toISOString()
    },
    {
      _id: "shot_3",
      sessionId: "sess_demo_002",
      shotNumber: 3,
      outcome: "Missed",
      releaseAngle: 142.0,
      elbowExtensionDelta: 16.5,
      kneeTimingSync: 68.0,
      performanceIndex: 62.0,
      isIllegalExtension: true,
      timestamp: new Date(Date.now() - 86400000 + 60000).toISOString()
    }
  ],
  biomechanicsLogs: []
};

let isConnectedToMongo = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sporttrack';
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500
    });
    isConnectedToMongo = true;
    console.log(`[Database] MongoDB Connected Successfully: ${mongoose.connection.host}`);
  } catch (error) {
    console.log(`[Database] MongoDB connection unavailable (${error.message}).`);
    console.log(`[Database] Running in high-performance Resilient Fallback Mode (In-Memory Data Store active).`);
    isConnectedToMongo = false;
  }
};

module.exports = {
  connectDB,
  isConnected: () => isConnectedToMongo,
  memoryStore
};

