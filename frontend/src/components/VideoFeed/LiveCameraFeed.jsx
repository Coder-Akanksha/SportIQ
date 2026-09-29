import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { visionAPI } from '../../services/api';
import { aiWebSocket } from '../../services/aiWebSocket';
import {
  Camera,
  CameraOff,
  Sparkles,
  ShieldCheck,
  Activity,
  Layers,
  Zap,
  Radio
} from 'lucide-react';
import { clsx } from 'clsx';

// Standard 33-point MediaPipe Body Skeleton Connection Pairs
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

export const LiveCameraFeed = () => {
  const {
    sportType,
    dominantSide,
    telemetry,
    updateTelemetry
  } = useApp();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [annotatedOverlayImg, setAnnotatedOverlayImg] = useState(null);
  const [showHUD, setShowHUD] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [isProcessing, setIsProcessing] = useState(false);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.warn('Webcam permission not granted or no camera available:', err.message);
      setCameraError('Webcam unavailable or permission not granted. Enable camera permissions or upload video clips in the Video Analysis tab.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setAnnotatedOverlayImg(null);
    aiWebSocket.disconnect();
  };

  // High-performance real-time streaming pipeline via WebSocket with HTTP fallback
  useEffect(() => {
    if (!isCameraActive) {
      aiWebSocket.disconnect();
      return;
    }

    aiWebSocket.connect();
    const unsubStatus = aiWebSocket.onStatusChange(setWsStatus);
    const unsubMsg = aiWebSocket.onMessage((msg) => {
      if (msg && msg.telemetry) {
        updateTelemetry(msg.telemetry);
        if (msg.annotated_image) {
          setAnnotatedOverlayImg(msg.annotated_image);
        }
      }
    });

    let frameId;
    let lastTime = 0;
    const targetInterval = 1000 / 30; // 30 FPS (~33.3ms)
    let inFlightHttp = false;

    const streamLoop = async (time) => {
      if (!isCameraActive) return;

      if (time - lastTime >= targetInterval) {
        lastTime = time;

        if (videoRef.current && videoRef.current.readyState >= 2 && canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          canvas.width = 640;
          canvas.height = 360;
          ctx.drawImage(videoRef.current, 0, 0, 640, 360);

          const base64Img = canvas.toDataURL('image/jpeg', 0.60);

          if (aiWebSocket.isConnected) {
            aiWebSocket.sendFrame(base64Img, sportType, dominantSide);
          } else if (!inFlightHttp) {
            inFlightHttp = true;
            try {
              const res = await visionAPI.processFrame({
                imageBase64: base64Img,
                frameIndex: Math.floor(time / 33),
                sportType,
                dominantSide,
                render_overlays: true,
                render_trajectory: false, // Ensure no manual lines/trajectories are drawn
                render_hud: false
              });

              if (res && res.telemetry) {
                updateTelemetry(res.telemetry);
                if (res.annotated_image) {
                  setAnnotatedOverlayImg(res.annotated_image);
                }
              }
            } catch (err) {
              // ignore transient network errors
            } finally {
              inFlightHttp = false;
            }
          }
        }
      }

      frameId = requestAnimationFrame(streamLoop);
    };

    frameId = requestAnimationFrame(streamLoop);

    return () => {
      cancelAnimationFrame(frameId);
      unsubStatus();
      unsubMsg();
      aiWebSocket.disconnect();
    };
  }, [isCameraActive, sportType, dominantSide, updateTelemetry]);

  return (
    <div className="glass-panel-glow rounded-2xl overflow-hidden border border-slate-800 flex flex-col relative select-none">
      
      {/* Upper Control Bar */}
      <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className={clsx(
            'w-2.5 h-2.5 rounded-full',
            isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-500'
          )} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2">
            <span>{isCameraActive ? 'Live Webcam Vision Feed' : 'Optical Vision Tracking // Standby'}</span>
          </h3>

          {/* Real-time Connection Protocol Badge */}
          {isCameraActive && (
            <div className={clsx(
              'px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center space-x-1 border',
              wsStatus === 'connected'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            )}>
              <Radio className="w-3 h-3 animate-pulse" />
              <span>{wsStatus === 'connected' ? 'WS: LIVE 30 FPS' : 'HTTP STREAM'}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Toggle AI Skeleton */}
          <button
            onClick={() => setShowSkeleton(!showSkeleton)}
            className={clsx(
              'px-2.5 py-1 rounded text-xs font-semibold border transition-all flex items-center space-x-1',
              showSkeleton ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
            )}
            title="Toggle AI Markerless Skeleton Overlay"
          >
            <Activity className="w-3 h-3" />
            <span>Skeleton: {showSkeleton ? 'ON' : 'OFF'}</span>
          </button>

          {/* Toggle HUD */}
          <button
            onClick={() => setShowHUD(!showHUD)}
            className={clsx(
              'px-2.5 py-1 rounded text-xs font-semibold border transition-all',
              showHUD ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
            )}
          >
            HUD: {showHUD ? 'ON' : 'OFF'}
          </button>

          {/* Enable / Disable Webcam */}
          {isCameraActive ? (
            <button
              onClick={stopCamera}
              className="flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-sm shadow-rose-600/30"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Disable Cam</span>
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm shadow-cyan-600/30 transition-all"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Enable Webcam</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Video Viewport & Skeleton Overlays */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Offscreen frame capture canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Live Webcam Video */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={clsx('w-full h-full object-cover', !isCameraActive && 'hidden')}
        />

        {/* 1. Base Annotated Image (When available from AI Engine) */}
        {isCameraActive && showSkeleton && annotatedOverlayImg && (
          <img
            src={annotatedOverlayImg}
            alt="AI Skeleton Overlay"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        )}

        {/* 2. Transparent SVG AI Skeleton Overlay (Rendered directly from 2D coordinates) */}
        {isCameraActive && showSkeleton && telemetry?.landmarks_2d && !annotatedOverlayImg && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 640 360"
            preserveAspectRatio="none"
          >
            {/* Skeletal bone connection lines */}
            {SKELETON_CONNECTIONS.map(([p1, p2], idx) => {
              const pt1 = telemetry.landmarks_2d[p1];
              const pt2 = telemetry.landmarks_2d[p2];
              if (!pt1 || !pt2) return null;

              const isDominantArm = (p1.includes(dominantSide) && p2.includes(dominantSide));
              const strokeColor = isDominantArm
                ? (telemetry.isIllegalExtension ? '#EF4444' : '#10B981')
                : '#06B6D4';
              const strokeWidth = isDominantArm ? 3.5 : 2;

              return (
                <line
                  key={`bone-${idx}`}
                  x1={pt1[0]}
                  y1={pt1[1]}
                  x2={pt2[0]}
                  y2={pt2[1]}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeOpacity={0.9}
                />
              );
            })}

            {/* Skeletal joint nodes */}
            {Object.entries(telemetry.landmarks_2d).map(([name, pt]) => {
              if (name === 'nose') return null;
              const isDominant = name.includes(dominantSide);
              const isElbow = name === `${dominantSide}_elbow`;
              const jointColor = isDominant
                ? (telemetry.isIllegalExtension ? '#EF4444' : '#10B981')
                : '#22D3EE';

              return (
                <g key={`joint-${name}`}>
                  <circle
                    cx={pt[0]}
                    cy={pt[1]}
                    r={isDominant ? 5.5 : 3.5}
                    fill={jointColor}
                    stroke="#0F172A"
                    strokeWidth="1.5"
                  />
                  {isElbow && (
                    <text
                      x={pt[0] + 10}
                      y={pt[1] - 8}
                      fill={telemetry.isIllegalExtension ? '#EF4444' : '#10B981'}
                      fontSize="12"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {telemetry.elbowAngle ? telemetry.elbowAngle.toFixed(1) : ''}°
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* Standby Graphic when Camera is Disabled */}
        {!isCameraActive && (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-[#0B0F19]">
            <svg className="w-full h-full absolute inset-0 opacity-30" viewBox="0 0 800 450">
              <defs>
                <linearGradient id="grid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <rect width="800" height="450" fill="url(#grid)" />
              <circle cx="400" cy="225" r="140" stroke="#374151" strokeWidth="2" fill="none" strokeDasharray="6 6" />
              <line x1="100" y1="360" x2="700" y2="360" stroke="#4B5563" strokeWidth="2" />
              <ellipse cx="650" cy="180" rx="40" ry="20" stroke="#F59E0B" strokeWidth="3" fill="none" />
            </svg>

            <div className="relative z-10 flex flex-col items-center text-center px-4">
              <div className="w-14 h-14 rounded-2xl border-2 border-cyan-400/60 mb-3 bg-cyan-950/60 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <ShieldCheck className="w-7 h-7 text-cyan-300" />
              </div>

              <span className="text-sm font-mono font-bold text-cyan-300 tracking-wider uppercase">
                OPTICAL TRACKING // STANDBY
              </span>

              <span className="text-xs text-slate-400 font-mono mt-1">
                Calibrated θ_elbow: {telemetry.elbowAngle || 158.4}° | Dominant: {dominantSide.toUpperCase()}
              </span>

              <p className="text-xs text-slate-400 mt-3 max-w-md leading-relaxed">
                Click <span className="text-cyan-300 font-semibold">Enable Webcam</span> above for real-time 3D pose tracking, or head to <span className="text-emerald-300 font-semibold">Video Analysis</span> to evaluate recorded match footage.
              </p>
            </div>

            {cameraError && (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-amber-500/40 rounded-lg p-2.5 text-center text-xs text-amber-300 shadow-lg">
                <span>{cameraError}</span>
              </div>
            )}
          </div>
        )}

        {/* Real-time HUD Telemetry Overlays */}
        {showHUD && (
          <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="glass-panel px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs font-mono text-cyan-300">
                SPORTTRACK // {isCameraActive ? `LIVE 30 FPS` : 'STANDBY'} | DOM: {dominantSide.toUpperCase()}
              </div>

              <div className="flex items-center space-x-2">
                <div className={clsx(
                  'px-3 py-1 rounded-lg border text-xs font-mono font-bold tracking-wider',
                  telemetry.isIllegalExtension
                    ? 'bg-rose-500/30 text-rose-300 border-rose-500/60 animate-bounce'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                )}>
                  {telemetry.isIllegalExtension ? '⚠️ ILLEGAL EXTENSION >15°' : 'FORM: OPTIMAL'}
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div className="glass-panel p-2.5 rounded-xl border border-slate-800 space-y-1 text-xs font-mono">
                <div className="text-slate-400">ELBOW FLEXION: <span className="text-emerald-400 font-bold">{telemetry.elbowAngle !== undefined ? Number(telemetry.elbowAngle).toFixed(1) : '158.4'}°</span></div>
                <div className="text-slate-400">STRAIGHTENING Δ: <span className="text-cyan-400 font-bold">{telemetry.extensionDelta !== undefined ? Number(telemetry.extensionDelta).toFixed(1) : '6.5'}°</span></div>
                <div className="text-slate-400">KNEE FLEXION: <span className="text-purple-400 font-bold">{telemetry.kneeAngle !== undefined ? Number(telemetry.kneeAngle).toFixed(1) : '168.0'}°</span></div>
              </div>

              <div className="glass-panel px-3 py-2 rounded-xl border border-slate-800 text-right">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Performance Index</span>
                <span className="text-2xl font-black text-cyan-400 font-mono">PI {telemetry.piScore !== undefined ? Number(telemetry.piScore).toFixed(1) : '86.5'}</span>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default LiveCameraFeed;
