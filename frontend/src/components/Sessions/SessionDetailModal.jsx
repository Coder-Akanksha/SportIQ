import React from 'react';
import { X, Award, Target, ShieldAlert, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { PerformanceIndexGauge } from '../Analytics/PerformanceIndexGauge';

export const SessionDetailModal = ({ session, shots = [], onClose }) => {
  if (!session) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel-glow w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-900/95 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-white">{session.title}</h3>
            <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(session.createdAt).toLocaleDateString()}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{session.durationSeconds || 940}s</span>
              </span>
              <span className="uppercase text-cyan-400 font-bold">{session.sport}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Total Shots</span>
              <span className="text-2xl font-black text-white">{session.totalShots}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-emerald-400 block mb-1">Made / Accuracy</span>
              <span className="text-2xl font-black text-emerald-400">{session.madeShots} ({session.accuracyPercentage}%)</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-cyan-400 block mb-1">Performance Index</span>
              <span className="text-2xl font-black text-cyan-300">PI {session.performanceIndex}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-xs text-rose-400 block mb-1">Illegal Extensions</span>
              <span className="text-2xl font-black text-rose-400">{session.illegalExtensions}</span>
            </div>
          </div>

          {session.summary?.coachingFeedback && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Coaching Telemetry Notes</h4>
              <ul className="space-y-1 text-xs text-slate-300">
                {session.summary.coachingFeedback.map((tip, i) => (
                  <li key={i} className="leading-relaxed">{tip}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Shot Telemetry Matrix ({shots.length > 0 ? shots.length : 'Log'})
            </h4>
            
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Shot #</th>
                    <th className="p-3">Outcome</th>
                    <th className="p-3">Release Angle</th>
                    <th className="p-3">Straightening Δ</th>
                    <th className="p-3">Knee Sync</th>
                    <th className="p-3">PI Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {(shots.length > 0 ? shots : [
                    { shotNumber: 1, outcome: 'Made', releaseAngle: 158.4, elbowExtensionDelta: 6.2, kneeTimingSync: 92.0, performanceIndex: 88.0 },
                    { shotNumber: 2, outcome: 'Made', releaseAngle: 161.0, elbowExtensionDelta: 7.0, kneeTimingSync: 94.5, performanceIndex: 91.2 },
                    { shotNumber: 3, outcome: 'Missed', releaseAngle: 142.0, elbowExtensionDelta: 16.5, kneeTimingSync: 68.0, performanceIndex: 62.0 },
                  ]).map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-white">#{s.shotNumber || idx + 1}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center space-x-1 font-bold ${
                          s.outcome === 'Made' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {s.outcome === 'Made' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>{s.outcome}</span>
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-200">{s.releaseAngle}°</td>
                      <td className={`p-3 font-mono ${s.elbowExtensionDelta > 15 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                        {s.elbowExtensionDelta}° {s.elbowExtensionDelta > 15 && '(Flagged)'}
                      </td>
                      <td className="p-3 font-mono text-cyan-300">{s.kneeTimingSync}%</td>
                      <td className="p-3 font-mono font-bold text-white">{s.performanceIndex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SessionDetailModal;

