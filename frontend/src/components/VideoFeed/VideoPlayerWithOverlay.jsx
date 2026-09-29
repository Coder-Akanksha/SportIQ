import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Bookmark,
  ShieldAlert,
  Layers,
  Activity
} from 'lucide-react';
import { clsx } from 'clsx';

// 3D Skeleton Connection pairs
const SKELETON_CONNECTIONS = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];

export const VideoPlayerWithOverlay = ({
  videoUrl,
  telemetryData,
  shotEvents = [],
  onFrameMetrics
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentFrameMetrics, setCurrentFrameMetrics] = useState(null);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const computeSkeletonForTime = (timeSec) => {
    const frameIdx = Math.floor(timeSec * 30);
    // Dynamic periodic motion simulation based on shot releases
    const cycle = (timeSec % 3.0) / 3.0; // 3-second shooting drill loop
    const elbowAngle = cycle < 0.4 
      ? 90.0 + (cycle / 0.4) * 72.0       // 90° -> 162° extension
      : (cycle < 0.7 
          ? 162.0 - ((cycle - 0.4) / 0.3) * 32.0 // Follow-through to 130°
          : 130.0 - ((cycle - 0.7) / 0.3) * 40.0 // Return to rest 90°
        );

    const delta = Math.max(0, (elbowAngle - 145.0) * 0.85);
    // Flag illegal extension around shot 3 (between 6.0s and 7.5s)
    const isViolationWindow = timeSec >= 6.0 && timeSec <= 7.5;
    const finalDelta = isViolationWindow ? 16.5 : delta;
    const isIllegal = finalDelta > 15.0;

    // Kinematic joint coordinates (normalized 0..1 to scale across video player)
    const armRad = ((elbowAngle - 90) * Math.PI) / 180.0;
    const elbowX = 0.52 + Math.cos(armRad) * 0.08;
    const elbowY = 0.42 - Math.sin(armRad) * 0.08;
    const wristX = elbowX + Math.cos(armRad * 1.2) * 0.09;
    const wristY = elbowY - Math.sin(armRad * 1.2) * 0.09;

    const landmarks = {
      left_shoulder: [0.46, 0.38],
      right_shoulder: [0.54, 0.38],
      left_elbow: [0.43, 0.47],
      left_wrist: [0.42, 0.56],
      right_elbow: [Number(elbowX.toFixed(3)), Number(elbowY.toFixed(3))],
      right_wrist: [Number(wristX.toFixed(3)), Number(wristY.toFixed(3))],
      left_hip: [0.47, 0.58],
      right_hip: [0.53, 0.58],
      left_knee: [0.46, 0.74],
      right_knee: [0.54, 0.74],
      left_ankle: [0.45, 0.90],
      right_ankle: [0.55, 0.90]
    };

    return {
      frame: frameIdx,
      elbowAngle: Math.round(elbowAngle * 10) / 10,
      kneeAngle: 165.0 + Math.sin(cycle * Math.PI) * 10.0,
      extensionDelta: Math.round(finalDelta * 10) / 10,
      isIllegal,
      landmarks
    };
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      const metrics = computeSkeletonForTime(cur);
      setCurrentFrameMetrics(metrics);

      // Compute elapsed shot outcome progress up to current time
      const elapsedShots = shotEvents.filter(s => (s.timestamp_ms / 1000.0) <= cur);
      const totalElapsed = elapsedShots.length;
      const madeElapsed = elapsedShots.filter(s => s.outcome === 'Made').length;
      const missedElapsed = totalElapsed - madeElapsed;
      const accElapsed = totalElapsed > 0 ? Math.round((madeElapsed / totalElapsed) * 100) : 100;
      const violationsElapsed = elapsedShots.filter(s => (s.extension_delta || 0) > 15.0).length;

      if (onFrameMetrics) {
        onFrameMetrics({
          timeSec: cur,
          frame: metrics.frame,
          elbowAngle: metrics.elbowAngle,
          extensionDelta: metrics.extensionDelta,
          isIllegal: metrics.isIllegal,
          totalShots: totalElapsed,
          madeShots: madeElapsed,
          missedShots: missedElapsed,
          accuracy: accElapsed,
          violations: violationsElapsed,
          recentShots: elapsedShots
        });
      }
    }
  };

  const stepFrame = (forward = true) => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
      videoRef.current.currentTime += (forward ? 1 : -1) / 30.0;
    }
  };

  const seekToShot = (timestampMs) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestampMs / 1000.0;
    }
  };

  return (
    <div className="glass-panel-glow rounded-2xl overflow-hidden border border-slate-800 flex flex-col">
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl || '/sample_sports_clip.mp4'}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 10)}
          className="w-full h-full object-cover"
        />

        {/* Real-Time Markerless 3D AI Skeleton Overlay */}
        {showSkeleton && currentFrameMetrics?.landmarks && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
          >
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Skeleton Bone Connections */}
            {SKELETON_CONNECTIONS.map(([p1, p2], idx) => {
              const pt1 = currentFrameMetrics.landmarks[p1];
              const pt2 = currentFrameMetrics.landmarks[p2];
              if (!pt1 || !pt2) return null;

              const isDominantArm = p1.includes('right') && p2.includes('right');
              const strokeColor = isDominantArm
                ? (currentFrameMetrics.isIllegal ? '#EF4444' : '#10B981')
                : '#06B6D4';
              const strokeWidth = isDominantArm ? 6 : 4;

              return (
                <line
                  key={`bone-${idx}`}
                  x1={pt1[0] * 1000}
                  y1={pt1[1] * 1000}
                  x2={pt2[0] * 1000}
                  y2={pt2[1] * 1000}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  filter="url(#glow)"
                  strokeOpacity={0.95}
                />
              );
            })}

            {/* Skeleton Joint Nodes */}
            {Object.entries(currentFrameMetrics.landmarks).map(([name, pt]) => {
              const isDominant = name.includes('right');
              const isElbow = name === 'right_elbow';
              const jointColor = isDominant
                ? (currentFrameMetrics.isIllegal ? '#EF4444' : '#10B981')
                : '#22D3EE';

              return (
                <g key={`joint-${name}`}>
                  <circle
                    cx={pt[0] * 1000}
                    cy={pt[1] * 1000}
                    r={isDominant ? 9 : 6}
                    fill={jointColor}
                    stroke="#0F172A"
                    strokeWidth="3"
                  />
                  {isElbow && (
                    <text
                      x={pt[0] * 1000 + 16}
                      y={pt[1] * 1000 - 12}
                      fill={currentFrameMetrics.isIllegal ? '#EF4444' : '#10B981'}
                      fontSize="24"
                      fontFamily="monospace"
                      fontWeight="bold"
                      stroke="#0F172A"
                      strokeWidth="1"
                    >
                      {currentFrameMetrics.elbowAngle}°
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        <div className="absolute top-4 left-4 glass-panel px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300 border border-slate-700/80">
          TIME: {currentTime.toFixed(2)}s | FRAME: {Math.floor(currentTime * 30)}
        </div>

        {currentFrameMetrics && (
          <div className="absolute top-4 right-4 flex items-center space-x-2">
            <div className={clsx(
              'glass-panel px-3 py-1.5 rounded-lg border text-xs font-mono font-bold',
              currentFrameMetrics.isIllegal
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'text-emerald-400 border-emerald-500/40'
            )}>
              θ_elbow: {currentFrameMetrics.elbowAngle}° (Δ {currentFrameMetrics.extensionDelta}°)
            </div>
          </div>
        )}

        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 opacity-0 hover:opacity-100 transition-opacity"
        >
          {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
        </button>
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
        {/* Scrubber with Shot Milestone Markers */}
        <div className="relative">
          <input
            type="range"
            min="0"
            max={duration || 10}
            step="0.033"
            value={currentTime}
            onChange={(e) => {
              if (videoRef.current) {
                videoRef.current.currentTime = parseFloat(e.target.value);
              }
            }}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          {shotEvents.map((shot, idx) => {
            const leftPct = ((shot.timestamp_ms / 1000.0) / Math.max(duration, 1)) * 100;
            return (
              <button
                key={idx}
                onClick={() => seekToShot(shot.timestamp_ms)}
                title={`Shot #${shot.shot_id || idx + 1}: ${shot.outcome} (Release: ${shot.release_angle}°)`}
                className={clsx(
                  'absolute top-0 w-3 h-3 rounded-full -translate-x-1/2 hover:scale-150 transition-transform shadow-md',
                  shot.outcome === 'Made' ? 'bg-emerald-400 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'
                )}
                style={{ left: `${Math.min(Math.max(leftPct, 2), 98)}%` }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => stepFrame(false)}
              title="Previous Frame (1/30s)"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => stepFrame(true)}
              title="Next Frame (1/30s)"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className={clsx(
                'px-2.5 py-1 rounded text-xs font-semibold border transition-all flex items-center space-x-1 ml-2',
                showSkeleton ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
              )}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Skeleton: {showSkeleton ? 'ON' : 'OFF'}</span>
            </button>

            <span className="text-xs font-mono text-slate-400 ml-2">
              {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
            </span>
          </div>

          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            {[0.25, 0.5, 1.0, 2.0].map((spd) => (
              <button
                key={spd}
                onClick={() => {
                  setPlaybackSpeed(spd);
                  if (videoRef.current) videoRef.current.playbackRate = spd;
                }}
                className={clsx(
                  'px-2 py-0.5 rounded transition-colors',
                  playbackSpeed === spd ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                )}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerWithOverlay;
