import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';
import { Activity, ShieldAlert, Sparkles } from 'lucide-react';

export const ElbowAngleChart = ({
  data = [],
  currentAngle = 158.4,
  extensionDelta = 6.5,
  isIllegal = false,
  sportType = 'basketball'
}) => {
  const chartData = data.length > 5 ? data : [
    { frame: 'f10', angle: 95.0, delta: 2.0, limit: 15.0 },
    { frame: 'f20', angle: 110.0, delta: 4.5, limit: 15.0 },
    { frame: 'f30', angle: 135.0, delta: 8.0, limit: 15.0 },
    { frame: 'f40', angle: 152.0, delta: 12.0, limit: 15.0 },
    { frame: 'f50', angle: 162.5, delta: 6.5, limit: 15.0 },
    { frame: 'f60', angle: 160.0, delta: 4.0, limit: 15.0 },
    { frame: 'f70', angle: 130.0, delta: 2.0, limit: 15.0 },
    { frame: 'f80', angle: 98.0, delta: 1.0, limit: 15.0 },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase text-white">
              Elbow Flexion Angle &amp; 15° Extension Telemetry
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Formula: <code className="text-cyan-300 font-mono">θ_elbow = arccos((V_SE · V_EW) / (||V_SE|| ||V_EW||))</code>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-xs text-slate-400 block uppercase font-semibold">Live θ_elbow</span>
            <span className={`text-2xl font-black ${isIllegal ? 'text-rose-400' : 'text-emerald-400'}`}>
              {currentAngle.toFixed(1)}°
            </span>
          </div>
          <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider ${
            isIllegal
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
          }`}>
            {isIllegal ? 'ILLEGAL EXTENSION (>15°)' : 'LEGAL FORM'}
          </div>
        </div>
      </div>

      {/* Recharts Area Curve */}
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="angleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="deltaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            
            <XAxis dataKey="frame" stroke="#6B7280" fontSize={11} tickLine={false} />
            <YAxis stroke="#6B7280" fontSize={11} domain={[0, 180]} tickLine={false} />
            
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                borderColor: '#374151',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px'
              }}
            />

            <ReferenceLine y={160} stroke="#06B6D4" strokeDasharray="4 4" label={{ value: 'Target Release (160°)', fill: '#06B6D4', fontSize: 10 }} />
            <ReferenceLine y={15} stroke="#EF4444" strokeWidth={1.5} label={{ value: 'Max Legal Delta (15.0°)', fill: '#EF4444', fontSize: 10 }} />

            <Area
              type="monotone"
              dataKey="angle"
              name="Elbow Angle (°)"
              stroke="#10B981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#angleGradient)"
            />

            <Line
              type="monotone"
              dataKey="delta"
              name="Extension Delta (°)"
              stroke="#06B6D4"
              strokeWidth={2}
              dot={{ r: 3, fill: '#06B6D4' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
          <span>Elbow Angle θ_elbow</span>
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block ml-3" />
          <span>Straightening Delta Δ</span>
          <span className="w-2.5 h-0.5 bg-rose-500 inline-block ml-3" />
          <span>15° Limit</span>
        </div>
        <span className="font-mono text-cyan-400">Current Δ: {extensionDelta.toFixed(1)}°</span>
      </div>

    </div>
  );
};

export default ElbowAngleChart;

