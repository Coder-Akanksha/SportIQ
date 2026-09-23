import React, { useState } from 'react';
import { VideoUploader } from '../components/VideoFeed/VideoUploader';
import { VideoPlayerWithOverlay } from '../components/VideoFeed/VideoPlayerWithOverlay';
import { PerformanceIndexGauge } from '../components/Analytics/PerformanceIndexGauge';
import { ElbowAngleChart } from '../components/Analytics/ElbowAngleChart';
import { ShotOutcomeCounter } from '../components/Analytics/ShotOutcomeCounter';
import { CoachingFeedback } from '../components/Analytics/CoachingFeedback';
import { Film, CheckCircle2, ShieldAlert, Cpu } from 'lucide-react';

export const VideoAnalysis = () => {
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
  };

  const summary = analysisResult?.analysis || {
    total_frames: 240,
    fps: 30.0,
    processing_fps: 28.5,
    duration_seconds: 8.0,
    shot_summary: {
      total_shots: 4,
      made_shots: 3,
      missed_shots: 1,
      accuracy_percentage: 75.0,
      recent_shots: [
        { shot_id: 1, outcome: 'Made', release_angle: 158.5, extension_delta: 7.2, timestamp_ms: 2200 },
        { shot_id: 2, outcome: 'Made', release_angle: 161.0, extension_delta: 6.8, timestamp_ms: 4500 },
        { shot_id: 3, outcome: 'Missed', release_angle: 144.0, extension_delta: 16.2, timestamp_ms: 6800 },
        { shot_id: 4, outcome: 'Made', release_angle: 159.2, extension_delta: 8.1, timestamp_ms: 8100 }
      ]
    },
    final_performance_index: {
      overall_pi: 82.4,
      grade: 'PRO',
      accuracy_score: 75.0,
      elbow_stability_score: 86.0,
      knee_timing_score: 89.5,
      coaching_insights: [
        "[VIOLATION] Shot #3 flagged for elbow extension exceeding 15.0°.",
        "[SUCCESS] Optimal release corridor maintained on 3 of 4 shots.",
        "[SYNC] Lower body kinetic drive is providing 65% of projectile velocity."
      ]
    },
    illegal_extensions_detected: 1
  };

  const pi = summary.final_performance_index;
  const shotStats = summary.shot_summary;

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">Video-Based Markerless Motion Capture &amp; Analysis</h2>
          <p className="text-xs text-slate-400 mt-1">Upload high-speed sports recordings for 30+ FPS computer vision telemetry extraction</p>
        </div>
      </div>

      {/* Upload and Video Player Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col: Uploader & Synchronized Player (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <VideoUploader onAnalysisComplete={handleAnalysisComplete} />
          
          <VideoPlayerWithOverlay
            videoUrl={analysisResult?.annotatedVideoUrl || '/sample_data/sample_sports_clip.mp4'}
            shotEvents={shotStats?.recent_shots || []}
          />
        </div>

        {/* Right Col: Extracted Kinematic & Shot Analytics (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {pi && (
            <PerformanceIndexGauge
              score={pi.overall_pi || 82.4}
              grade={pi.grade || 'PRO'}
              accuracyScore={pi.accuracy_score || 75.0}
              elbowStabilityScore={pi.elbow_stability_score || 86.0}
              kneeTimingScore={pi.knee_timing_score || 89.5}
              illegalExtensions={summary.illegal_extensions_detected || 0}
            />
          )}

          {shotStats && (
            <ShotOutcomeCounter
              totalShots={shotStats.total_shots || 4}
              madeShots={shotStats.made_shots || 3}
              missedShots={shotStats.missed_shots || 1}
              accuracy={shotStats.accuracy_percentage || 75.0}
              recentShots={shotStats.recent_shots || []}
            />
          )}

          {pi?.coaching_insights && (
            <CoachingFeedback insights={pi.coaching_insights} />
          )}
        </div>

      </div>

    </div>
  );
};

export default VideoAnalysis;

