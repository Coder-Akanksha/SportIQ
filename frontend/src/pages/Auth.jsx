import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Activity,
  Lock,
  Mail,
  User,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Zap,
  Target,
  Layers,
  Award
} from 'lucide-react';
import { clsx } from 'clsx';

export const Auth = () => {
  const { login, register, authError, setAuthError } = useApp();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'player',
    sport: 'basketball',
    dominantSide: 'right'
  });

  // Client Validation Errors
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;

    if (!formData.email || !formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (mode === 'register') {
      if (!formData.name || !formData.name.trim()) {
        errs.name = 'Full name is required';
      }
      if (formData.password !== formData.confirmPassword) {
        errs.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(formData.email.trim(), formData.password);
      } else {
        await register({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
          sport: formData.sport,
          dominantSide: formData.dominantSide
        });
      }
    } catch (err) {
      // Error handled in AppContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole = 'player') => {
    setIsLoading(true);
    setAuthError(null);
    try {
      if (demoRole === 'coach') {
        await login('coach.sarah@sporttrack.ai', 'coach123').catch(async () => {
          // If not registered yet, auto-register demo user
          await register({
            name: 'Coach Sarah Miller',
            email: 'coach.sarah@sporttrack.ai',
            password: 'coach123',
            role: 'coach',
            sport: 'cricket_bowling',
            dominantSide: 'right'
          });
        });
      } else {
        await login('alex.athlete@sporttrack.ai', 'athlete123').catch(async () => {
          await register({
            name: 'Alex Rivera (Pro Player)',
            email: 'alex.athlete@sporttrack.ai',
            password: 'athlete123',
            role: 'player',
            sport: 'basketball',
            dominantSide: 'right'
          });
        });
      }
    } catch (err) {
      console.error('Demo login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Background Neon Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />

      {/* Main Auth Container */}
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* Left Column: Brand, Value Proposition & Vision Tech Badges */}
        <div className="lg:col-span-6 space-y-6">
          
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-cyan-400 to-emerald-400 flex items-center justify-center shadow-xl shadow-cyan-500/25">
              <Activity className="w-7 h-7 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
                <span>SPORT<span className="text-cyan-400">TRACK</span></span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  v2.0 AUTH
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Vision Analytics &amp; Markerless Biomechanics Platform
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Elite Biomechanics, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-emerald-300">
                Driven by Computer Vision.
              </span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Markerless 3D joint kinematics, instantaneous elbow flexion angle (<code className="text-cyan-300 font-mono text-xs">θ_elbow</code>), 15° illegal extension detection, and real-time shot verification for elite athletes &amp; coaches.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-1">
              <div className="flex items-center space-x-2 text-cyan-400">
                <Target className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Shot Rule Engine</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Automated Made vs. Missed classification &amp; trajectory arc verification.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-1">
              <div className="flex items-center space-x-2 text-emerald-400">
                <Zap className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">15° Extension Rule</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Dynamic arm straightening delta tracking to flag illegal bowling actions.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-1">
              <div className="flex items-center space-x-2 text-purple-400">
                <Layers className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Kinetic Sequencing</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Proximal-to-distal angular velocity mapping across kinetic segments.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-1">
              <div className="flex items-center space-x-2 text-amber-400">
                <Award className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">Performance Index</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Multi-factor composite scoring: 0.40(Acc) + 0.35(Elbow) + 0.25(Knee).
              </p>
            </div>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-cyan-950/40 border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant 1-Click Demo Evaluation</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">No typing required</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('player')}
                disabled={isLoading}
                className="py-2 px-3 rounded-lg text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 transition-all flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <span>⚡ Demo Athlete</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('coach')}
                disabled={isLoading}
                className="py-2 px-3 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 transition-all flex items-center justify-center space-x-1.5 shadow-sm"
              >
                <span>⚡ Demo Coach</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Sign In / Register Form Glass Card */}
        <div className="lg:col-span-6">
          <div className="glass-panel-glow rounded-3xl p-7 sm:p-8 border border-slate-700/80 bg-slate-900/80 shadow-2xl relative">
            
            {/* Mode Switcher Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrors({});
                  setAuthError(null);
                }}
                className={clsx(
                  'flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center',
                  mode === 'login'
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrors({});
                  setAuthError(null);
                }}
                className={clsx(
                  'flex-1 py-2 rounded-lg text-xs font-bold transition-all text-center',
                  mode === 'register'
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                Create Account
              </button>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-start space-x-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                <span className="font-medium">{authError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                    <input
                      type="text"
                      placeholder="e.g. Alex Rivera"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={clsx(
                        'w-full bg-slate-950 text-xs text-slate-200 border rounded-xl pl-10 pr-4 py-2.5 focus:outline-none transition-colors',
                        errors.name ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-cyan-500'
                      )}
                    />
                  </div>
                  {errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="email"
                    placeholder="athlete@sporttrack.ai"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={clsx(
                      'w-full bg-slate-950 text-xs text-slate-200 border rounded-xl pl-10 pr-4 py-2.5 focus:outline-none transition-colors',
                      errors.email ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-cyan-500'
                    )}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={clsx(
                      'w-full bg-slate-950 text-xs text-slate-200 border rounded-xl pl-10 pr-10 py-2.5 focus:outline-none transition-colors',
                      errors.password ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-cyan-500'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-rose-400 mt-1">{errors.password}</p>}
              </div>

              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className={clsx(
                          'w-full bg-slate-950 text-xs text-slate-200 border rounded-xl pl-10 pr-4 py-2.5 focus:outline-none transition-colors',
                          errors.confirmPassword ? 'border-rose-500 focus:border-rose-400' : 'border-slate-800 focus:border-cyan-500'
                        )}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-[11px] text-rose-400 mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Sport & Role Pickers */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Your Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="player">Athlete / Player</option>
                        <option value="coach">Coach / Trainer</option>
                        <option value="analyst">Biomechanics Analyst</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Primary Sport
                      </label>
                      <select
                        value={formData.sport}
                        onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                        className="w-full bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500"
                      >
                        <option value="basketball">🏀 Basketball</option>
                        <option value="cricket_bowling">🏏 Cricket Bowling</option>
                        <option value="tennis_serve">🎾 Tennis Serve</option>
                        <option value="football">⚽ Football</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Dominant Arm / Leg
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, dominantSide: 'right' })}
                        className={clsx(
                          'py-2 rounded-xl text-xs font-bold border transition-all',
                          formData.dominantSide === 'right'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        )}
                      >
                        Right-Handed
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, dominantSide: 'left' })}
                        className={clsx(
                          'py-2 rounded-xl text-xs font-bold border transition-all',
                          formData.dominantSide === 'left'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                        )}
                      >
                        Left-Handed
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-cyan-500 via-emerald-400 to-emerald-500 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Authenticating...</span>
                  </span>
                ) : (
                  <>
                    <span>{mode === 'login' ? 'Sign In to Cockpit' : 'Complete Registration'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
              {mode === 'login' ? (
                <span>
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setMode('register');
                      setErrors({});
                      setAuthError(null);
                    }}
                    className="text-cyan-400 font-bold hover:underline"
                  >
                    Create Account
                  </button>
                </span>
              ) : (
                <span>
                  Already registered?{' '}
                  <button
                    onClick={() => {
                      setMode('login');
                      setErrors({});
                      setAuthError(null);
                    }}
                    className="text-cyan-400 font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default Auth;

