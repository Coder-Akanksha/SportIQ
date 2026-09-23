import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Activity,
  Video,
  Layers,
  History,
  Settings,
  Circle,
  Play,
  Square,
  Cpu,
  Flame,
  ShieldAlert,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Shield
} from 'lucide-react';
import { clsx } from 'clsx';

export const Navbar = () => {
  const {
    activeTab,
    setActiveTab,
    sportType,
    setSportType,
    dominantSide,
    setDominantSide,
    isRecording,
    startNewSession,
    stopCurrentSession,
    telemetry,
    user,
    logout
  } = useApp();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sports = [
    { id: 'basketball', label: 'Basketball', icon: '🏀' },
    { id: 'cricket_bowling', label: 'Cricket Bowling (15°)', icon: '🏏' },
    { id: 'tennis_serve', label: 'Tennis Serve', icon: '🎾' },
    { id: 'football', label: 'Football Strike', icon: '⚽' },
  ];

  const navItems = [
    { id: 'dashboard', label: 'Live Cockpit', icon: Activity },
    { id: 'video-analysis', label: 'Video Analysis', icon: Video },
    { id: 'biomechanics', label: 'Biomechanics Studio', icon: Layers },
    { id: 'history', label: 'Session History', icon: History },
    { id: 'settings', label: 'Rules & Config', icon: Settings },
  ];

  const getInitials = (name) => {
    if (!name) return 'AT';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'coach':
        return { label: 'COACH', style: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'analyst':
        return { label: 'ANALYST', style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'admin':
        return { label: 'ADMIN', style: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      default:
        return { label: 'ATHLETE', style: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 bg-[#0B0F19]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Vision AI Status */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-400 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black tracking-tight text-lg text-white">
                  SPORT<span className="text-cyan-400">TRACK</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  VISION AI
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                Markerless Biomechanics &amp; Shot Verification
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={clsx(
                    'flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  )}
                >
                  <Icon className={clsx('w-4 h-4', isActive ? 'text-cyan-400' : 'text-slate-500')} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Sport Selector, Live Recording, & User Profile Dropdown */}
          <div className="flex items-center space-x-3">
            {/* Sport Select */}
            <select
              value={sportType}
              onChange={(e) => setSportType(e.target.value)}
              className="hidden sm:block bg-slate-900 text-xs font-medium text-slate-200 border border-slate-700/80 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              {sports.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.label}
                </option>
              ))}
            </select>

            {/* Arm Side Toggle */}
            <button
              onClick={() => setDominantSide(dominantSide === 'right' ? 'left' : 'right')}
              title="Toggle Dominant Hand/Arm"
              className="hidden lg:block px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors"
            >
              {dominantSide === 'right' ? 'R-Hand' : 'L-Hand'}
            </button>

            {/* Live Session Recording Button */}
            {isRecording ? (
              <button
                onClick={stopCurrentSession}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 animate-pulse transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>STOP (REC)</span>
              </button>
            ) : (
              <button
                onClick={() => startNewSession()}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>START DRILL</span>
              </button>
            )}

            {/* User Profile Menu with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-1 pl-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 transition-all"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-sm">
                  {getInitials(user?.name)}
                </div>
                <div className="hidden sm:block text-left pr-1">
                  <span className="text-xs font-bold text-slate-200 block truncate max-w-[100px]">
                    {user?.name?.split(' ')[0] || 'Athlete'}
                  </span>
                  <span className={clsx('text-[9px] font-bold uppercase tracking-wider px-1 rounded border', roleInfo.style)}>
                    {roleInfo.label}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Popup */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900/95 border border-slate-700/90 shadow-2xl p-3 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2 border-b border-slate-800 pb-3">
                    <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <div className="mt-2 flex items-center space-x-1.5">
                      <span className={clsx('text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border', roleInfo.style)}>
                        {roleInfo.label}
                      </span>
                      <span className="text-[10px] text-cyan-300 font-mono">
                        {dominantSide.toUpperCase()}-HANDED
                      </span>
                    </div>
                  </div>

                  <div className="py-2 space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                    >
                      <Settings className="w-4 h-4 text-cyan-400" />
                      <span>Account &amp; Rule Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('history');
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                    >
                      <History className="w-4 h-4 text-emerald-400" />
                      <span>My Performance History</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
