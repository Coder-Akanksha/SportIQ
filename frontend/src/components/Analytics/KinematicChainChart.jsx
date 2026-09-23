import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { Zap, CheckCircle2 } from 'lucide-react';

export const KinematicChainChart = ({ data }) => {
  const sequenceData = data || [
    { timeMs: 0, phase: 'Knee Dip', knee: 120, hip: 45, shoulder: 20, elbow: 30, wrist: 25 },
    { timeMs: 60, phase: 'Drive', knee: 380, hip: 180, shoulder: 60, elbow: 50, wrist: 40 },
    { timeMs: 120, phase: 'Hip Ext', knee: 220, hip: 410, shoulder: 190, elbow: 90, wrist: 85 },
    { timeMs: 180, phase: 'Shoulder', knee: 90, hip: 260, shoulder: 460, elbow: 210, wrist: 160 },
    { timeMs: 240, phase: 'Elbow Set', knee: 40, hip: 110, shoulder: 310, elbow: 540, wrist: 310 },
    { timeMs: 300, phase: 'Release', knee: 15, hip: 40, shoulder: 140, elbow: 420, wrist: 780 },
    { timeMs: 360, phase: 'Follow', knee: 10, hip: 20, shoulder: 60, elbow: 120, wrist: 210 }
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase text-white">
              Kinetic Chain Velocity Sequencing (Ground to Wrist)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Proximal-to-Distal Segment Angular Velocities (deg/s)
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-bold text-purple-300">
          <CheckCircle2 className="w-4 h-4 text-purple-400" />
          <span>92.4% Transfer Efficiency</span>
        </div>
      </div>

      {/* Recharts Multi-line Velocity Curve */}
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sequenceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            
            <XAxis dataKey="phase" stroke="#6B7280" fontSize={11} tickLine={false} />
            <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
            
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                borderColor: '#374151',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

            <Line type="monotone" dataKey="knee" name="Knee Drive" stroke="#06B6D4" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="hip" name="Hip Rotation" stroke="#10B981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="shoulder" name="Shoulder Elevation" stroke="#F59E0B" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="elbow" name="Elbow Extension" stroke="#A855F7" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="wrist" name="Wrist Snap" stroke="#EC4899" strokeWidth={3} dot={{ r: 4, fill: '#EC4899' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
        <span className="text-slate-400">Optimal Sequence:</span>
        <span className="font-mono text-cyan-400">
          Knee Peak (t=60ms) → Hip (t=120ms) → Shoulder (t=180ms) → Elbow (t=240ms) → Wrist (t=300ms)
        </span>
      </div>

    </div>
  );
};

export default KinematicChainChart;

