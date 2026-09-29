import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { visionAPI } from '../../services/api';
import {
  UploadCloud,
  FileVideo,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Clock,
  RotateCcw,
  X
} from 'lucide-react';
import { clsx } from 'clsx';

export const VideoUploader = ({ onAnalysisComplete }) => {
  const { sportType, dominantSide, refreshDashboard } = useApp();
  const fileInputRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState(null);

  // Timer and progressive status updater for long-running video analysis
  useEffect(() => {
    let timer;
    if (isProcessing) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next === 5) {
            setStatusMessage('Executing MediaPipe 3D Pose Estimation & Joint Tracking...');
          } else if (next === 15) {
            setStatusMessage('Computing 3D Biomechanics Kinematics & 15° Extension Rule...');
          } else if (next === 30) {
            setStatusMessage('Tracking Ball Flight Path & Running Shot Verification Rule Engine...');
          } else if (next === 50) {
            setStatusMessage('Synthesizing Composite Performance Index & Rendering Overlays...');
          } else if (next === 80) {
            setStatusMessage('Deep video analysis in progress (high resolution / frame count)...');
          }
          return next;
        });
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isProcessing]);

  const handleFile = (file) => {
    if (file && (file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|avi|webm|mkv)$/i))) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError('Please select a valid sports video file (.mp4, .mov, .avi, .webm).');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const formatErrorMessage = (err) => {
    if (err.customMessage) return err.customMessage;

    const errMsg = err.response?.data?.error || err.message || '';
    if (err.code === 'ECONNABORTED' || errMsg.toLowerCase().includes('timeout') || errMsg.toLowerCase().includes('exceeded')) {
      return 'The video analysis request timed out. High-frame-rate or high-resolution sports videos require extended processing time on CPU. For best results, ensure the Python AI microservice is running, or test with a shorter play clip (5–15 seconds).';
    }
    if (errMsg.toLowerCase().includes('network error') || err.code === 'ERR_NETWORK') {
      return 'Network connection to the vision server failed. Please ensure the backend gateway (port 5000) and AI vision engine (port 8000) are active.';
    }
    return errMsg || 'Failed to process video file. Please try again.';
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setStatusMessage('Uploading video to computer vision pipeline...');

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('sportType', sportType);
      formData.append('dominantSide', dominantSide);

      const result = await visionAPI.uploadVideo(formData, (progress) => {
        setUploadProgress(progress);
        if (progress === 100) {
          setStatusMessage('Decoding frames & executing 3D MediaPipe Pose Estimation...');
        }
      });

      setStatusMessage('Analysis complete! Updating dashboards...');
      await refreshDashboard();

      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      console.error('Video analysis error:', err);
      setError(formatErrorMessage(err));
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleRunSampleAnalysis = async () => {
    setIsProcessing(true);
    setStatusMessage('Analyzing Built-In High-Frame-Rate Sports Clip...');
    setError(null);

    try {
      const dummyFile = new File(["sample-video"], "sample_sports_clip.mp4", { type: "video/mp4" });
      const formData = new FormData();
      formData.append('video', dummyFile);
      formData.append('sportType', sportType);
      formData.append('dominantSide', dominantSide);

      const result = await visionAPI.uploadVideo(formData, (p) => setUploadProgress(p));
      await refreshDashboard();
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }
    } catch (err) {
      console.error('Sample analysis error:', err);
      setError(formatErrorMessage(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <UploadCloud className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold uppercase tracking-wide text-white">
            Upload Video for 30+ FPS Markerless Analysis
          </h3>
        </div>

        <button
          onClick={handleRunSampleAnalysis}
          disabled={isProcessing}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 transition-all shadow-sm disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Run Demo Clip</span>
        </button>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-8 text-center transition-all flex flex-col items-center justify-center my-3',
          isProcessing ? 'cursor-not-allowed border-slate-700/50 bg-slate-950/60' : 'cursor-pointer',
          isDragging
            ? 'border-cyan-400 bg-cyan-500/10'
            : 'border-slate-700/80 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/60'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          disabled={isProcessing}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3">
          <FileVideo className="w-6 h-6 text-cyan-400" />
        </div>

        <p className="text-sm font-semibold text-white mb-1">
          {selectedFile ? selectedFile.name : 'Click to Browse or Drag & Drop Sports Video'}
        </p>
        <p className="text-xs text-slate-400">
          Supports MP4, MOV, WebM, AVI (up to 150MB)
        </p>
      </div>

      {/* Error Alert with Dismiss & Troubleshooting Guidance */}
      {error && (
        <div className="my-2 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <p className="leading-relaxed font-medium">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-white p-0.5 ml-2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Long-Running Active Processing Progress Bar & Status */}
      {isProcessing && (
        <div className="my-3 p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 shadow-lg shadow-cyan-950/20 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
            <span className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>{statusMessage}</span>
            </span>
            <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{elapsedSeconds}s</span>
            </div>
          </div>

          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-400 transition-all duration-300 animate-pulse"
              style={{ width: `${uploadProgress > 0 && uploadProgress < 100 ? uploadProgress : 100}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-400 font-mono">
            Processing at ~30 FPS on AI vision engine. Please keep this tab open.
          </p>
        </div>
      )}

      {/* Action Button */}
      <button
        onClick={handleUploadAndAnalyze}
        disabled={!selectedFile || isProcessing}
        className={clsx(
          'w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg',
          selectedFile && !isProcessing
            ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-cyan-500/20'
            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Analyzing Video ({elapsedSeconds}s)...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-current" />
            <span>Start Vision Analytics</span>
          </>
        )}
      </button>
    </div>
  );
};

export default VideoUploader;
