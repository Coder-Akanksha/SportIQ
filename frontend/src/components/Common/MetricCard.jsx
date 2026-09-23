import React from 'react';
import { clsx } from 'clsx';

export const MetricCard = ({ title, value, unit = '', subtitle, icon: Icon, trend, color = 'cyan', badge }) => {
  const colorMap = {
    cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
    green: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    purple: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
    amber: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
    red: 'text-rose-400 border-rose-500/20 bg-rose-500/5',
  };

  const iconBgMap = {
    cyan: 'bg-cyan-500/10 text-cyan-400',
    green: 'bg-emerald-500/10 text-emerald-400',
    purple: 'bg-purple-500/10 text-purple-400',
    amber: 'bg-amber-500/10 text-amber-400',
    red: 'bg-rose-500/10 text-rose-400',
  };

  return (
    <div className="glass-panel rounded-xl p-5 border border-slate-800/80 hover:border-slate-700 transition-all shadow-lg hover:shadow-cyan-950/20">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{title}</span>
        {Icon && (
          <div className={clsx('p-2 rounded-lg', iconBgMap[color] || iconBgMap.cyan)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-extrabold tracking-tight text-white">{value}</span>
        {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
      </div>

      {(subtitle || trend || badge) && (
        <div className="mt-3 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
          {badge && (
            <span className={clsx('px-2 py-0.5 rounded-full font-medium', colorMap[color])}>
              {badge}
            </span>
          )}
          {trend && (
            <span className={clsx('font-semibold flex items-center', trend > 0 ? 'text-emerald-400' : 'text-rose-400')}>
              {trend > 0 ? '↑ +' : '↓ '}{trend}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricCard;

