import React from 'react';
import { clsx } from 'clsx';
import { Award, Zap, Crosshair, HelpCircle } from 'lucide-react';

export const PerformanceIndexGauge = ({
  score = 86.5,
  grade = 'PRO',
  accuracyScore = 80.0,
  elbowStabilityScore = 88.5,
  kneeTimingScore = 92.0,
  illegalExtensions = 0
}) => {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(score, 100) / 100) * circumference;

  const getGradeColor = (g) => {
    switch (g) {
      case 'ELITE': return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
      case 'PRO': return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
      case 'COMPETENT': return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
      default: return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
    }
  };

  const getGaugeColor = (s) => {
    if (s >= 90) return '#06B6D4';
    if (s >= 80) return '#10B981';
    if (s >= 65) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <div className="glass-panel-glow rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
      
      {/* Header with Tooltip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase text-white">Performance Index (PI)</h3>
        </div>
        <div className="group relative cursor-pointer">
          <HelpCircle className="w-4 h-4 text-slate-500 hover:text-slate-300" />
          <div className="absolute right-0 top-6 w-64 p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-[11px] text-slate-300 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
            <p className="font-semibold text-cyan-400 mb-1">PI Multi-Factor Formula:</p>
            <p className="font-mono text-[10px] bg-slate-950 p-1.5 rounded border border-slate-800 text-slate-200">
              PI = 0.40(Acc) + 0.35(Elbow) + 0.25(Knee) - Penalty
            </p>
          </div>
        </div>
      </div>

      {/* Main Circular Gauge Display */}
      <div className="relative flex items-center justify-center my-4">
        <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#1F2937"
            strokeWidth="12"
            fill="transparent"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={getGaugeColor(score)}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-black tracking-tight text-white">{score.toFixed(1)}</span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Score / 100</span>
          <span className={clsx('mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border', getGradeColor(grade))}>
            {grade}
          </span>
        </div>
      </div>

      {/* Sub-Metric Factor Cards */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Accuracy (40%)</span>
          <span className="text-sm font-bold text-white">{accuracyScore}%</span>
        </div>
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Elbow (35%)</span>
          <span className="text-sm font-bold text-emerald-400">{elbowStabilityScore}</span>
        </div>
        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Knee (25%)</span>
          <span className="text-sm font-bold text-cyan-400">{kneeTimingScore}</span>
        </div>
      </div>

      {illegalExtensions > 0 && (
        <div className="mt-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-1.5 text-center">
          <span className="text-[11px] font-bold text-rose-400">
            ⚠️ {illegalExtensions} Illegal Extension(s) &gt;15° Flagged
          </span>
        </div>
      )}

    </div>
  );
};

export default PerformanceIndexGauge;

