import React from 'react';
import { Target, Flame, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';

export const ShotOutcomeCounter = ({
  totalShots = 20,
  madeShots = 16,
  missedShots = 4,
  accuracy = 80.0,
  currentStreak = 4,
  bestStreak = 6,
  recentShots = []
}) => {
  const shotsList = recentShots.length > 0 ? recentShots : [
    { shot_id: 1, outcome: 'Made' },
    { shot_id: 2, outcome: 'Made' },
    { shot_id: 3, outcome: 'Made' },
    { shot_id: 4, outcome: 'Missed' },
    { shot_id: 5, outcome: 'Made' },
    { shot_id: 6, outcome: 'Made' },
    { shot_id: 7, outcome: 'Made' },
    { shot_id: 8, outcome: 'Made' },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
      
      {/* Header with Streak Fire Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold tracking-wide uppercase text-white">Shot Verification Rule Engine</h3>
        </div>

        {currentStreak >= 3 && (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider animate-pulse">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span>{currentStreak} STREAK!</span>
          </div>
        )}
      </div>

      {/* Main Stats Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
        <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-center">
          <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">Total Shots</span>
          <span className="text-3xl font-black text-white">{totalShots}</span>
        </div>

        <div className="bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-500/30 text-center">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase block mb-1 flex items-center justify-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Made</span>
          </span>
          <span className="text-3xl font-black text-emerald-400">{madeShots}</span>
        </div>

        <div className="bg-rose-950/30 p-3.5 rounded-xl border border-rose-500/30 text-center">
          <span className="text-[11px] font-semibold text-rose-400 uppercase block mb-1 flex items-center justify-center space-x-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Missed</span>
          </span>
          <span className="text-3xl font-black text-rose-400">{missedShots}</span>
        </div>

        <div className="bg-cyan-950/30 p-3.5 rounded-xl border border-cyan-500/30 text-center">
          <span className="text-[11px] font-semibold text-cyan-400 uppercase block mb-1 flex items-center justify-center space-x-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Accuracy</span>
          </span>
          <span className="text-3xl font-black text-cyan-300">{accuracy.toFixed(0)}%</span>
        </div>
      </div>

      {/* Accuracy Progress Bar */}
      <div className="my-3">
        <div className="flex justify-between text-xs font-semibold mb-1">
          <span className="text-slate-400">Target Efficiency</span>
          <span className="text-emerald-400">{accuracy.toFixed(1)}% Conversion</span>
        </div>
        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-emerald-500 transition-all duration-500"
            style={{ width: `${Math.min(accuracy, 100)}%` }}
          />
        </div>
      </div>

      {/* Recent Shot Outcomes Feed */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Recent Shots:</span>
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {shotsList.slice(-10).map((s, idx) => (
            <div
              key={idx}
              title={`Shot #${s.shot_id || idx + 1}: ${s.outcome}`}
              className={clsx(
                'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-transform hover:scale-110',
                s.outcome === 'Made'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                  : 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
              )}
            >
              {s.outcome === 'Made' ? '✓' : '✗'}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default ShotOutcomeCounter;

