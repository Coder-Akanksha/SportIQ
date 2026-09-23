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
  Layers
} from 'lucide-react';
import { clsx } from 'clsx';

export const VideoPlayerWithOverlay = ({ videoUrl, telemetryData, shotEvents = [] }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(10);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentFrameMetrics, setCurrentFrameMetrics] = useState(null);

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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      const frameIdx = Math.floor(cur * 30);
      const phase = (frameIdx % 90) / 90.0;
      const angle = phase > 0.45 ? 160.0 : (90.0 + phase * 140.0);
      const delta = Math.max(0, (angle - 145) * 0.8);

      setCurrentFrameMetrics({
        frame: frameIdx,
        elbowAngle: Math.round(angle * 10) / 10,
        kneeAngle: 165.0,
        extensionDelta: Math.round(delta * 10) / 10,
        isIllegal: delta > 15.0
      });
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
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoUrl || '/sample_sports_clip.mp4'}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => setDuration(videoRef.current?.duration || 10)}
          className="w-full h-full object-cover"
        />

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
                title={`Shot #${shot.shot_id || idx + 1}: ${shot.outcome}`}
                className={clsx(
                  'absolute top-0 w-2.5 h-2.5 rounded-full -translate-x-1/2 hover:scale-150 transition-transform',
                  shot.outcome === 'Made' ? 'bg-emerald-400' : 'bg-rose-500'
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

