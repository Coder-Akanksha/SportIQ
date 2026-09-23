import React from 'react';
import { clsx } from 'clsx';

export const Badge = ({ children, variant = 'default', size = 'md' }) => {
  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    cyan: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30',
    green: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
    red: 'bg-rose-950/60 text-rose-300 border-rose-500/30',
    purple: 'bg-purple-950/60 text-purple-300 border-purple-500/30',
  };

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span className={clsx('inline-flex items-center font-medium border rounded-full', variantStyles[variant], sizeStyles[size])}>
      {children}
    </span>
  );
};

export default Badge;

