import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { visionAPI } from '../../services/api';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Maximize2,
  ShieldAlert,
  Sliders,
  Sparkles,
  Play,
  Square
} from 'lucide-react';
import { clsx } from 'clsx';

export const LiveCameraFeed = () => {
  const {
    sportType,
    dominantSide,
    telemetry,
    updateTelemetry,
    isRecording,
    startNewSession,
    stopCurrentSession
  } = useApp();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [annotatedOverlayImg, setAnnotatedOverlayImg] = useState(null);
  const [showHUD, setShowHUD] = useState(true);
  const [frameCounter, setFrameCounter] = useState(0);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.warn('Webcam permission not granted or no camera available:', err.message);
      setCameraError('Webcam not active. Running in Real-Time AI Simulation Feed mode.');
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
  };

  useEffect(() => {
    let intervalId;
    let localFrame = 0;

    if (isCameraActive) {
      intervalId = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState !== 4) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = 640;
        canvas.height = 360;
        ctx.drawImage(videoRef.current, 0, 0, 640, 360);

        const base64Img = canvas.toDataURL('image/jpeg', 0.65);
        localFrame++;
        setFrameCounter(localFrame);

        try {
          const res = await visionAPI.processFrame({
            imageBase64: base64Img,
            frameIndex: localFrame,
            sportType,
            dominantSide,
            render_overlays: true
          });

          if (res && res.telemetry) {
            updateTelemetry(res.telemetry);
            if (res.annotated_image) {
              setAnnotatedOverlayImg(res.annotated_image);
            }
          }
        } catch (e) {
          // Ignore transient network errors
        }
      }, 70);
    } else {
      intervalId = setInterval(() => {
        localFrame++;
        setFrameCounter(localFrame);
        const phase = (localFrame % 90) / 90.0;
        
        let elbow = 90.0;
        let knee = 175.0;
        let delta = 4.0;
        let state = 'REST';
        let isIll = false;

        if (phase < 0.35) {
          knee = 175.0 - (phase / 0.35) * 45.0;
          elbow = 90.0 + (phase / 0.35) * 30.0;
          state = 'FLEXED';
        } else if (phase < 0.55) {
          knee = 130.0 + ((phase - 0.35) / 0.20) * 48.0;
          elbow = 120.0 + ((phase - 0.35) / 0.20) * 42.0;
          delta = ((phase - 0.35) / 0.20) * 8.5;
          state = 'RELEASE';
          if (sportType === 'cricket_bowling' && phase > 0.48) {
            delta = 16.8;
            isIll = true;
          }
        } else {
          knee = 178.0;
          elbow = 162.0 - ((phase - 0.55) / 0.45) * 65.0;
          state = 'FOLLOW_THROUGH';
        }

        updateTelemetry({
          elbowAngle: Math.round(elbow * 10) / 10,
          kneeAngle: Math.round(knee * 10) / 10,
          extensionDelta: Math.round(delta * 10) / 10,
          isIllegalExtension: isIll,
          armState: state,
          fps: 30.0,
          latencyMs: 14.2
        });
      }, 80);
    }

    return () => clearInterval(intervalId);
  }, [isCameraActive, sportType, dominantSide]);

  return (
    <div className="glass-panel-glow rounded-2xl overflow-hidden border border-slate-800 flex flex-col relative">
      
      {/* Upper Control Bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            {isCameraActive ? 'Live Webcam Vision Feed' : 'Real-Time Biomechanics Simulation Feed'}
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowHUD(!showHUD)}
            className={clsx(
              'px-2.5 py-1 rounded text-xs font-semibold border transition-all',
              showHUD ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
            )}
          >
            HUD Overlays: {showHUD ? 'ON' : 'OFF'}
          </button>

          {isCameraActive ? (
            <button
              onClick={stopCamera}
              className="flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Disable Cam</span>
            </button>
          ) : (
            <button
              onClick={startCamera}
              className="flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm shadow-cyan-600/30"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Enable Webcam</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Video / Canvas Viewport */}
      <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="hidden" />

        <video
          ref={videoRef}
          playsInline
          muted
          className={clsx('w-full h-full object-cover', !isCameraActive && 'hidden')}
        />

        {isCameraActive && annotatedOverlayImg && showHUD && (
          <img
            src={annotatedOverlayImg}
            alt="AI Pose Overlay"
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        )}

        {!isCameraActive && (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-[#0B0F19]">
            <svg className="w-full h-full absolute inset-0 opacity-40" viewBox="0 0 800 450">
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

            <div className="relative z-10 flex flex-col items-center">
              <div className="relative w-48 h-64 flex items-center justify-center">
                <div
                  className={clsx(
                    'w-6 h-6 rounded-full border-2 absolute top-16 right-8 animate-ping',
                    telemetry.isIllegalExtension ? 'border-rose-500 bg-rose-500/40' : 'border-emerald-400 bg-emerald-400/40'
                  )}
                />
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full border-2 border-cyan-400 mx-auto mb-2 bg-cyan-950/60 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                    <Sparkles className="w-6 h-6 text-cyan-300" />
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-300 tracking-wider">
                    {telemetry.armState} PHASE
                  </span>
                  <span className="text-xs text-slate-400 block font-mono">
                    θ_elbow: {telemetry.elbowAngle}° (Δ {telemetry.extensionDelta}°)
                  </span>
                </div>
              </div>
            </div>

            {cameraError && (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-slate-700/80 rounded-lg p-2.5 text-center text-xs text-slate-300">
                <span>{cameraError}</span>
              </div>
            )}
          </div>
        )}

        {showHUD && (
          <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="glass-panel px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs font-mono text-cyan-300">
                SPORTTRACK // FPS: 30.0 | DOM: {dominantSide.toUpperCase()}
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
                <div className="text-slate-400">ELBOW FLEXION: <span className="text-emerald-400 font-bold">{telemetry.elbowAngle}°</span></div>
                <div className="text-slate-400">STRAIGHTENING Δ: <span className="text-cyan-400 font-bold">{telemetry.extensionDelta}°</span></div>
                <div className="text-slate-400">KNEE FLEXION: <span className="text-purple-400 font-bold">{telemetry.kneeAngle}°</span></div>
              </div>

              <div className="glass-panel px-3 py-2 rounded-xl border border-slate-800 text-right">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Performance Index</span>
                <span className="text-2xl font-black text-cyan-400 font-mono">PI {telemetry.piScore}</span>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default LiveCameraFeed;

