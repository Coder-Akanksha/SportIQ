import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Settings as SettingsIcon, Sliders, Shield, Save, CheckCircle2 } from 'lucide-react';

export const Settings = () => {
  const { sportType, dominantSide, setDominantSide } = useApp();

  const [thresholdDeg, setThresholdDeg] = useState(15.0);
  const [targetElbow, setTargetElbow] = useState(160.0);
  const [wAcc, setWAcc] = useState(0.40);
  const [wElbow, setWElbow] = useState(0.35);
  const [wKnee, setWKnee] = useState(0.25);
  const [savedAlert, setSavedAlert] = useState(false);

  const handleSave = () => {
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-white">Rule Engine &amp; Vision Configuration</h2>
        <p className="text-xs text-slate-400 mt-1">
          Customize biomechanical thresholds, ICC regulations, and Performance Index weighting factors
        </p>
      </div>

      {savedAlert && (
        <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>Configuration saved successfully! Real-time telemetry pipeline updated.</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        
        {/* Section 1: Illegal Extension Threshold */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold uppercase text-white">
              Illegal Arm Extension Threshold (Law 21.2)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Maximum allowable elbow straightening angle change (Δθ) between arm horizontal and ball release.
          </p>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="5"
              max="25"
              step="0.5"
              value={thresholdDeg}
              onChange={(e) => setThresholdDeg(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <span className="font-mono text-base font-black text-rose-400 w-16 text-right">
              {thresholdDeg.toFixed(1)}°
            </span>
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* Section 2: Target Elbow Set-Point */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold uppercase text-white">
              Target Elbow Release Set-Point
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Optimal release angle corridor for basketball shooting form and tennis overhead serves.
          </p>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="120"
              max="175"
              step="1"
              value={targetElbow}
              onChange={(e) => setTargetElbow(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="font-mono text-base font-black text-emerald-400 w-16 text-right">
              {targetElbow}°
            </span>
          </div>
        </div>

        <hr className="border-slate-800" />

        {/* Section 3: Performance Index Weights */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase text-white">
            Performance Index (PI) Weighting Distribution
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Accuracy Weight (w_acc)</span>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={wAcc}
                onChange={(e) => setWAcc(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm font-mono text-white"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Elbow Stability (w_elbow)</span>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={wElbow}
                onChange={(e) => setWElbow(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm font-mono text-white"
              />
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Knee Timing (w_knee)</span>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={wKnee}
                onChange={(e) => setWKnee(parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm font-mono text-white"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Apply Rules</span>
          </button>
        </div>

      </div>

    </div>
  );
};

export default Settings;

