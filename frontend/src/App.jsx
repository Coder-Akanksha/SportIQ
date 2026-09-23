import React from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { VideoAnalysis } from './pages/VideoAnalysis';
import { BiomechanicsStudio } from './pages/BiomechanicsStudio';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Activity, Loader2 } from 'lucide-react';

export const App = () => {
  const { activeTab, isAuthenticated, authLoading } = useApp();

  // Initial authentication check spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#070A11] flex flex-col items-center justify-center font-['Plus_Jakarta_Sans',sans-serif] text-slate-100">
        <div className="relative flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-cyan-400 to-emerald-400 flex items-center justify-center shadow-2xl shadow-cyan-500/30 animate-pulse">
            <Activity className="w-8 h-8 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex items-center space-x-2 text-sm font-bold text-cyan-300">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Verifying SportTrack Session...</span>
          </div>
        </div>
      </div>
    );
  }

  // Protected Route Guard: If not authenticated, present the Auth view
  if (!isAuthenticated) {
    return <Auth />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'video-analysis':
        return <VideoAnalysis />;
      case 'biomechanics':
        return <BiomechanicsStudio />;
      case 'history':
        return <History />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-slate-100 selection:bg-cyan-500 selection:text-black">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderActiveTab()}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#080C14] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span className="font-bold text-slate-400">SportTrack: Vision Analytics for Field Sports</span>
            <span className="mx-2">•</span>
            <span>3D Markerless Pose Estimation &amp; Biomechanical Kinematics</span>
          </div>
          <div className="font-mono text-[11px] text-cyan-400">
            θ_elbow = arccos((V_SE · V_EW) / (||V_SE|| ||V_EW||))
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
