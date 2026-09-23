import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { analyticsAPI, visionAPI, sessionsAPI, authAPI } from '../services/api';
import { getSocket } from '../services/socket';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Navigation & Sport State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sportType, setSportType] = useState('basketball');
  const [dominantSide, setDominantSide] = useState('right');
  const [isRecording, setIsRecording] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  // Authentication State
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('sporttrack_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('sporttrack_token') || null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Live Telemetry Stream State
  const [telemetry, setTelemetry] = useState({
    elbowAngle: 158.4,
    kneeAngle: 168.0,
    extensionDelta: 6.5,
    isIllegalExtension: false,
    armState: 'REST',
    confidence: 0.94,
    fps: 30.0,
    latencyMs: 18.2,
    piScore: 86.5,
    grade: 'PRO',
    shotStats: {
      totalShots: 15,
      madeShots: 12,
      missedShots: 3,
      accuracyPercentage: 80.0,
      currentStreak: 4,
      bestStreak: 6
    },
    coachingInsights: [
      "[SUCCESS] High set-point release detected.",
      "[SYNC] Kinetic chain sequence: Knee extension synchronized with wrist snap."
    ]
  });

  const [aiHealth, setAiHealth] = useState({ online: false, checking: true });
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Check and hydrate authenticated user on initial load
  const verifyAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('sporttrack_token');
    if (!storedToken) {
      setUser(null);
      setToken(null);
      setAuthLoading(false);
      return;
    }

    try {
      setAuthLoading(true);
      const res = await authAPI.getProfile();
      if (res && res.user) {
        setUser(res.user);
        localStorage.setItem('sporttrack_user', JSON.stringify(res.user));
        if (res.user.sport) setSportType(res.user.sport);
        if (res.user.dominantSide) setDominantSide(res.user.dominantSide);
      }
    } catch (error) {
      console.warn('Session verification failed, logging out:', error.message);
      logout();
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const res = await authAPI.login({ email, password });
      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('sporttrack_token', res.token);
        localStorage.setItem('sporttrack_user', JSON.stringify(res.user));
        if (res.user.sport) setSportType(res.user.sport);
        if (res.user.dominantSide) setDominantSide(res.user.dominantSide);
        await refreshDashboard();
        return { success: true, user: res.user };
      } else {
        throw new Error(res.error || 'Login failed');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Login failed. Please check your credentials.';
      setAuthError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const register = async (userData) => {
    setAuthError(null);
    try {
      const res = await authAPI.register(userData);
      if (res.success && res.token) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('sporttrack_token', res.token);
        localStorage.setItem('sporttrack_user', JSON.stringify(res.user));
        if (res.user.sport) setSportType(res.user.sport);
        if (res.user.dominantSide) setDominantSide(res.user.dominantSide);
        await refreshDashboard();
        return { success: true, user: res.user };
      } else {
        throw new Error(res.error || 'Registration failed');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Registration failed. Please check your information.';
      setAuthError(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sporttrack_token');
    localStorage.removeItem('sporttrack_user');
    setIsRecording(false);
    setActiveSession(null);
    setActiveTab('dashboard');
  };

  const updateUserProfile = async (updates) => {
    try {
      const res = await authAPI.updateProfile(updates);
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('sporttrack_user', JSON.stringify(res.user));
        if (res.user.sport) setSportType(res.user.sport);
        if (res.user.dominantSide) setDominantSide(res.user.dominantSide);
        return res.user;
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  const checkHealth = async () => {
    try {
      const res = await visionAPI.getHealth();
      setAiHealth({ online: res.online !== false, details: res.data || res });
    } catch (e) {
      setAiHealth({ online: false, error: e.message });
    }
  };

  const refreshDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const data = await analyticsAPI.getDashboardSummary();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load dashboard summary:', error);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    verifyAuth();
    checkHealth();
    refreshDashboard();

    const socket = getSocket();
    socket.on('telemetry_stream', (data) => {
      if (data) {
        setTelemetry(prev => ({
          ...prev,
          ...data
        }));
      }
    });

    const handleAuthExpired = () => {
      logout();
    };
    window.addEventListener('sporttrack_auth_expired', handleAuthExpired);

    return () => {
      socket.off('telemetry_stream');
      window.removeEventListener('sporttrack_auth_expired', handleAuthExpired);
    };
  }, [verifyAuth]);

  const updateTelemetry = (newTelemetry) => {
    setTelemetry(prev => {
      const updated = { ...prev, ...newTelemetry };
      const socket = getSocket();
      socket.emit('live_telemetry', updated);
      return updated;
    });
  };

  const startNewSession = async (title) => {
    try {
      const newSess = await sessionsAPI.createSession({
        title: title || `${sportType.toUpperCase()} Drill Session (${user?.name || 'Athlete'})`,
        sport: sportType,
        dominantSide: dominantSide,
        totalShots: 0,
        madeShots: 0,
        missedShots: 0,
        accuracyPercentage: 0,
        performanceIndex: 85.0
      });
      setActiveSession(newSess);
      setIsRecording(true);
      return newSess;
    } catch (e) {
      console.error('Failed to start session:', e);
    }
  };

  const stopCurrentSession = () => {
    setIsRecording(false);
    setActiveSession(null);
    refreshDashboard();
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AppContext.Provider
      value={{
        // Auth
        user,
        token,
        isAuthenticated,
        authLoading,
        authError,
        setAuthError,
        login,
        register,
        logout,
        updateUserProfile,
        // App State
        activeTab,
        setActiveTab,
        sportType,
        setSportType,
        dominantSide,
        setDominantSide,
        isRecording,
        setIsRecording,
        activeSession,
        startNewSession,
        stopCurrentSession,
        telemetry,
        updateTelemetry,
        aiHealth,
        checkHealth,
        dashboardData,
        refreshDashboard,
        loadingDashboard,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
