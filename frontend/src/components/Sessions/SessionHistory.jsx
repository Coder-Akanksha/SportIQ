import React, { useState, useEffect } from 'react';
import { sessionsAPI } from '../../services/api';
import { SessionDetailModal } from './SessionDetailModal';
import {
  Calendar,
  Clock,
  Award,
  ChevronRight,
  Download,
  Search,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { clsx } from 'clsx';

export const SessionHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedShots, setSelectedShots] = useState([]);
  const [filterSport, setFilterSport] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await sessionsAPI.getSessions();
      setSessions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleOpenDetail = async (sess) => {
    try {
      const res = await sessionsAPI.getSessionById(sess._id);
      setSelectedSession(res.session || sess);
      setSelectedShots(res.shots || []);
    } catch (e) {
      setSelectedSession(sess);
      setSelectedShots([]);
    }
  };

  const exportCSV = () => {
    const headers = ['Session Title', 'Sport', 'Date', 'Total Shots', 'Made', 'Missed', 'Accuracy %', 'PI Score', 'Illegal Extensions'];
    const rows = sessions.map(s => [
      `"${s.title}"`,
      s.sport,
      new Date(s.createdAt).toISOString().split('T')[0],
      s.totalShots,
      s.madeShots,
      s.missedShots,
      s.accuracyPercentage,
      s.performanceIndex,
      s.illegalExtensions
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sporttrack_sessions_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSessions = sessions.filter(s => {
    const matchesSport = filterSport === 'all' || s.sport === filterSport;
    const matchesQuery = !searchQuery || s.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesQuery;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">Historical Performance &amp; Drill Logs</h2>
          <p className="text-xs text-slate-400 mt-1">Review longitudinal kinematic consistency, accuracy rates, and rule compliance</p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search session title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterSport}
            onChange={(e) => setFilterSport(e.target.value)}
            className="bg-slate-900 text-xs font-medium text-slate-200 border border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Sports</option>
            <option value="basketball">Basketball</option>
            <option value="cricket_bowling">Cricket Bowling</option>
            <option value="tennis_serve">Tennis</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading performance history...</div>
      ) : filteredSessions.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center text-slate-400 text-xs">
          No training sessions found matching your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSessions.map((session) => (
            <div
              key={session._id}
              onClick={() => handleOpenDetail(session)}
              className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-950/20 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {session.sport}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>

                <h3 className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">
                  {session.title}
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2 my-4 text-center">
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase block">Shots</span>
                  <span className="text-base font-bold text-white">{session.totalShots}</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-emerald-400 uppercase block">Accuracy</span>
                  <span className="text-base font-bold text-emerald-400">{session.accuracyPercentage}%</span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] text-cyan-400 uppercase block">PI Score</span>
                  <span className="text-base font-bold text-cyan-300">{session.performanceIndex}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className={clsx(
                  'font-medium text-[11px]',
                  session.illegalExtensions > 0 ? 'text-rose-400' : 'text-emerald-400'
                )}>
                  {session.illegalExtensions > 0 ? `⚠️ ${session.illegalExtensions} Violation(s)` : '✓ Form Compliant'}
                </span>

                <span className="text-cyan-400 font-semibold flex items-center space-x-0.5 group-hover:translate-x-1 transition-transform">
                  <span>View Details</span>
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          shots={selectedShots}
          onClose={() => setSelectedSession(null)}
        />
      )}

    </div>
  );
};

export default SessionHistory;

