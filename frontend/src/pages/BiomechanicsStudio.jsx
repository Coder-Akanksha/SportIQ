import React, { useState, useEffect } from 'react';
import { visionAPI } from '../services/api';
import { Layers, ShieldAlert, CheckCircle2, Cpu, HelpCircle, RefreshCw, Sliders } from 'lucide-react';
import { clsx } from 'clsx';

export const BiomechanicsStudio = () => {
  const [shoulder, setShoulder] = useState({ x: 0.0, y: 1.0, z: 0.0 });
  const [elbow, setElbow] = useState({ x: 0.4, y: 0.8, z: 0.1 });
  const [wrist, setWrist] = useState({ x: 0.7, y: 0.6, z: 0.2 });

  const [computedAngle, setComputedAngle] = useState(158.4);
  const [isIllegal, setIsIllegal] = useState(false);
  const [formulaDetails, setFormulaDetails] = useState('');

  const calculateAngleDirectly = async () => {
    try {
      const res = await visionAPI.computeKinematics({
        shoulder: [shoulder.x, shoulder.y, shoulder.z],
        elbow: [elbow.x, elbow.y, elbow.z],
        wrist: [wrist.x, wrist.y, wrist.z],
        hip: [0.0, 0.0, 0.0],
        knee: [0.1, -0.5, 0.0],
        ankle: [0.1, -1.0, 0.0]
      });

      if (res) {
        setComputedAngle(res.elbow_flexion_angle_deg);
        setIsIllegal(res.is_illegal_straightening);
        setFormulaDetails(res.formula_used || 'arccos((V_SE . V_EW) / (||V_SE|| * ||V_EW||))');
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    calculateAngleDirectly();
  }, [shoulder, elbow, wrist]);

  const presetAngles = [
    { label: 'Right-Angle Set-Point (90°)', sh: [0, 1, 0], el: [0, 0, 0], wr: [1, 0, 0] },
    { label: 'Optimal High Release (160°)', sh: [0, 1, 0], el: [0.2, 0.5, 0], wr: [0.38, 0.05, 0] },
    { label: 'Illegal Bowling Straightening (>15° Δ)', sh: [0, 1, 0], el: [0.3, 0.8, 0], wr: [0.9, 0.5, 0] },
    { label: 'Fully Extended Arm (180°)', sh: [0, 2, 0], el: [0, 1, 0], wr: [0, 0, 0] },
  ];

  const applyPreset = (p) => {
    setShoulder({ x: p.sh[0], y: p.sh[1], z: p.sh[2] });
    setElbow({ x: p.el[0], y: p.el[1], z: p.el[2] });
    setWrist({ x: p.wr[0], y: p.wr[1], z: p.wr[2] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white">3D Biomechanics Kinematics &amp; Rule Engine Studio</h2>
        <p className="text-xs text-slate-400 mt-1">
          Markerless 3D vector physics validator for elbow flexion angles and 15-degree illegal extension thresholds
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel-glow p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center space-x-2 mb-3">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Kinematic Vector Derivation
              </h3>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
              <p className="text-slate-400">
                1. Vector Upper Arm: <span className="text-cyan-300">V_SE = P_shoulder - P_elbow</span>
              </p>
              <p className="text-slate-400">
                2. Vector Forearm: <span className="text-cyan-300">V_EW = P_wrist - P_elbow</span>
              </p>
              <p className="text-slate-400">
                3. Interior Angle: <span className="text-emerald-400 font-bold">θ_elbow = arccos((V_SE · V_EW) / (||V_SE|| · ||V_EW||))</span>
              </p>
              <p className="text-slate-400">
                4. Extension Rule: <span className="text-rose-400 font-bold">Flag Illegal if Δθ = (θ_release - θ_min) &gt; 15.0°</span>
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Quick Biomechanical Presets
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presetAngles.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => applyPreset(p)}
                  className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-left text-xs font-medium text-slate-200 transition-all flex items-center justify-between"
                >
                  <span>{p.label}</span>
                  <span className="text-cyan-400 text-[10px] font-bold uppercase">Apply</span>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Interactive 3D Landmark Adjuster
            </h3>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Wrist Position (X-Axis Extension):</span>
                <span className="text-cyan-400 font-bold">{wrist.x.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-1"
                max="1.5"
                step="0.05"
                value={wrist.x}
                onChange={(e) => setWrist({ ...wrist, x: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Wrist Height (Y-Axis Elevation):</span>
                <span className="text-cyan-400 font-bold">{wrist.y.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="-1"
                max="1.5"
                step="0.05"
                value={wrist.y}
                onChange={(e) => setWrist({ ...wrist, y: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel-glow p-6 rounded-2xl border border-slate-800 text-center flex flex-col justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Computed 3D Flexion Angle
            </h3>

            <div className="my-6">
              <span className="text-6xl font-black text-white tracking-tight">
                {computedAngle.toFixed(1)}°
              </span>
              <span className="block text-xs font-mono text-cyan-400 mt-2">
                θ_elbow in 3D Euclidean Space
              </span>
            </div>

            <div className={clsx(
              'p-4 rounded-xl border flex items-center space-x-3 text-left text-xs',
              isIllegal
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
            )}>
              {isIllegal ? (
                <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              )}
              <div>
                <span className="font-bold block uppercase tracking-wide">
                  {isIllegal ? 'ILLEGAL EXTENSION DETECTED (>15°)' : 'RULE COMPLIANT FORM (<=15°)'}
                </span>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {isIllegal
                    ? 'Elbow straightening exceeds the legal threshold during delivery. High risk of form disqualification.'
                    : 'Arm kinematics comply with legal standards. Excellent kinetic integrity.'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Active Keypoint Matrix</h4>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-slate-300">
              <div>SHOULDER: <span className="text-cyan-400">({shoulder.x}, {shoulder.y}, {shoulder.z})</span></div>
              <div>ELBOW:    <span className="text-emerald-400">({elbow.x}, {elbow.y}, {elbow.z})</span></div>
              <div>WRIST:    <span className="text-purple-400">({wrist.x}, {wrist.y}, {wrist.z})</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiomechanicsStudio;

