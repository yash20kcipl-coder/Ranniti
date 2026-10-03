import toast from 'react-hot-toast';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/hooks';
import { loginUser } from '@/redux/actions/auth';
import { FormInput } from '@/components/common/FormInput';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { BarChart3, Users2, Lock, Mail, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      await dispatch(loginUser({ email: email.trim(), password: password.trim() }));
      navigate('/dashboard');
    } catch {
      // Error notifications managed by Redux errorHandler middleware
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 overflow-y-auto lg:overflow-hidden">
      {/* LEFT SIDE: LOGIN FORM & CREDENTIALS */}
      <div className="w-full lg:w-[45%] xl:w-[40%] min-h-screen min-h-dvh flex-1 lg:flex-initial flex flex-col justify-between p-5 sm:p-8 lg:p-8 z-10 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/80 shadow-2xl transition-colors duration-200 shrink-0">

        {/* Brand Header with Theme Toggle */}
        <div className="flex items-center justify-between gap-3">
          {/* Logo: branded gradient pill in light mode so white logo stays visible */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 dark:bg-none dark:from-transparent dark:to-transparent dark:bg-transparent border border-indigo-500/40 dark:border-transparent shadow-lg shadow-indigo-500/20 dark:shadow-none transition-all duration-200">
              <img
                src="/ranniti-logo.png"
                alt="Ranniti"
                className="h-7 sm:h-8 md:h-9 w-auto object-contain"
              />
            </div>
          </div>

          <ThemeToggle size="sm" showLabel />
        </div>

        {/* Login Form Container */}
        <div className="my-auto py-6 sm:py-8 max-w-md w-full mx-auto space-y-6 sm:space-y-7">
          <div className="text-left space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              <Sparkles size={14} />
              <span>Admin Access Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Sign In to Dashboard</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Manage campaign strategies, booth intelligence, and voters master data.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <FormInput
              label="Email Address"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ranniti.com"
              required
              icon={<Mail size={18} />}
            />

            <FormInput
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              icon={<Lock size={18} />}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <FormInput
                name="rememberMe"
                type="checkbox"
                label="Remember me for 30 days"
                value={rememberMe}
                onChange={(e) => setRememberMe(e.target.value)}
              />
              <button
                type="button"
                onClick={() => toast('Please contact your administrator to reset password.')}
                className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors cursor-pointer self-start sm:self-auto"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Portal</span>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Quick Demo Login</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@ranniti.com');
                  setPassword('Amit@5667');
                }}
                className="px-3 py-2 text-left bg-slate-100 hover:bg-indigo-50 dark:bg-slate-900 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Tenant Admin</p>
                <p className="text-[10px] text-slate-500 truncate">admin@ranniti.com</p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('superadmin@ranniti.com');
                  setPassword('SuperAdmin@123456');
                }}
                className="px-3 py-2 text-left bg-slate-100 hover:bg-indigo-50 dark:bg-slate-900 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Super Admin</p>
                <p className="text-[10px] text-slate-500 truncate">superadmin@ranniti.com</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-900 pt-5 sm:pt-6 mt-4 sm:mt-0">
          <p>© 2026 Ranniti Tech Platform</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer transition-colors">Support</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: UNCLUTTERED FULL HERO BACKGROUND & SLEEK BOTTOM STRIP */}
      <div className="hidden lg:flex flex-1 relative bg-slate-950 overflow-hidden items-end p-8 xl:p-12">
        {/* Full View High-Resolution Background Hero Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('/assets/images/login-bg.jpg')` }}
        />

        {/* Subtle Gradient Overlays at Top & Bottom Only so Main View is 100% Unobscured */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/15 to-slate-950/40 pointer-events-none" />

        {/* Top Right Floating Command Badge */}
        <div className="absolute top-8 right-8 z-10">
          <div className="px-4 py-2 rounded-full bg-slate-950/60 border border-slate-700/60 backdrop-blur-md text-white text-xs font-bold flex items-center gap-2.5 shadow-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="tracking-wide">ELECTION COMMAND CENTER</span>
          </div>
        </div>

        {/* Bottom Horizontal Glass Strip - Unblocks Center Image */}
        <div className="relative z-10 w-full grid grid-cols-3 gap-4 text-left">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-700/60 backdrop-blur-md shadow-2xl flex items-center gap-3.5 hover:border-indigo-500/50 transition-all">
            <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="text-[11px] text-slate-300 font-medium">Voters Analyzed</p>
              <p className="text-lg font-black text-white">10.4M+</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-700/60 backdrop-blur-md shadow-2xl flex items-center gap-3.5 hover:border-emerald-500/50 transition-all">
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-[11px] text-slate-300 font-medium">Booth Coverage</p>
              <p className="text-lg font-black text-white">99.8% Active</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-700/60 backdrop-blur-md shadow-2xl flex items-center gap-3.5 hover:border-purple-500/50 transition-all">
            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex-shrink-0">
              <Users2 size={20} />
            </div>
            <div>
              <p className="text-[11px] text-slate-300 font-medium">Field Workers</p>
              <p className="text-lg font-black text-white">2,450+ Live</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
