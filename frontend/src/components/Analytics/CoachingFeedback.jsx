import React from 'react';
import { Sparkles, ShieldAlert, CheckCircle2, Zap, Crosshair, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

export const CoachingFeedback = ({ insights = [] }) => {
  const defaultInsights = [
    "[SUCCESS] Excellent set-point elevation and kinetic energy transfer from lower body.",
    "[SYNC] Ground reaction force through knee extension synchronized within 80ms of arm release.",
    "[MECHANICS] Elbow release angle maintained in optimal 155°-165° corridor with zero illegal straightening."
  ];

  const feedbackList = insights.length > 0 ? insights : defaultInsights;

  const parseInsight = (text) => {
    if (text.startsWith('[VIOLATION]')) {
      return {
        type: 'violation',
        badge: 'Violation Alert',
        icon: ShieldAlert,
        color: 'border-rose-500/40 bg-rose-950/30 text-rose-300',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        cleanText: text.replace('[VIOLATION]', '').trim()
      };
    }
    if (text.startsWith('[MECHANICS]') || text.startsWith('[TIMING]')) {
      return {
        type: 'warning',
        badge: 'Form Adjustment',
        icon: AlertTriangle,
        color: 'border-amber-500/40 bg-amber-950/30 text-amber-300',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        cleanText: text.replace(/\[MECHANICS\]|\[TIMING\]/, '').trim()
      };
    }
    if (text.startsWith('[ACCURACY]')) {
      return {
        type: 'accuracy',
        badge: 'Aim & Target',
        icon: Crosshair,
        color: 'border-cyan-500/40 bg-cyan-950/30 text-cyan-300',
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
        cleanText: text.replace('[ACCURACY]', '').trim()
      };
    }
    return {
      type: 'success',
      badge: 'Optimal Biomechanics',
      icon: CheckCircle2,
      color: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      cleanText: text.replace(/\[SUCCESS\]|\[SYNC\]/, '').trim()
    };
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 text-slate-950">
          <Sparkles className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-bold tracking-wide uppercase text-white">AI Biomechanics Coaching Engine</h3>
      </div>

      <div className="space-y-3">
        {feedbackList.map((item, idx) => {
          const parsed = parseInsight(item);
          const Icon = parsed.icon;
          return (
            <div
              key={idx}
              className={clsx(
                'p-3.5 rounded-xl border transition-all flex items-start space-x-3',
                parsed.color
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={clsx('text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border', parsed.badgeColor)}>
                    {parsed.badge}
                  </span>
                </div>
                <p className="text-xs font-medium leading-relaxed text-slate-200">
                  {parsed.cleanText}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoachingFeedback;

