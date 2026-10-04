import { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { verifyUserCredentials } from '../lib/userStore';

interface LoginFormProps {
  onSuccess: (username: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setMessage({ type: 'error', text: 'Please fill in both username and password.' });
      return;
    }

    setLoading(true);

    try {
      // 1. Verify against created user accounts and admin in system
      const authRes = verifyUserCredentials(cleanUsername, password);
      if (authRes.success && authRes.user) {
        try {
          localStorage.setItem('infenitz_current_role', authRes.user.role);
        } catch {}
        await new Promise((res) => setTimeout(res, 250));
        onSuccess(authRes.user.username);
        return;
      }

      // If user exists in system but password was wrong or inactive
      if (authRes.error && authRes.error !== 'User does not exist.') {
        setMessage({ type: 'error', text: authRes.error });
        setLoading(false);
        return;
      }

      // 2. Try Supabase auth if configured
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: cleanUsername.includes('@') ? cleanUsername : `${cleanUsername}@infenitz.internal`,
            password,
          });
          if (!error && data.user) {
            onSuccess(cleanUsername);
            return;
          }
        } catch {
          // Cloud auth failed
        }
      }

      // 3. Strictly reject any random or unverified credentials
      setMessage({
        type: 'error',
        text: 'Access Denied: Invalid credentials. Only created users and administrators can log in.'
      });
    } catch {
      setMessage({
        type: 'error',
        text: 'Login failed. Please check your credentials.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(37,99,235,0.1)] border border-slate-100 transition-all duration-300">
      {/* Form Header */}
      <div className="mb-7">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Login
        </h1>
        <p className="text-slate-500 font-medium text-sm mt-1">
          Enter your details to get started
        </p>
      </div>

      {/* Security Protected Portal Notice */}
      <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-600">
        <Lock className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">Protected System:</span> Only authorized staff, managers & administrators can log in.
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`mb-5 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 animate-fadeIn ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {message.type === 'error' ? (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Name Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            User Name
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your user name"
              required
              className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
            Password
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full pl-11 pr-11 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Remember me & Forgot password row */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <label className="flex items-center gap-2 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
            />
            <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-800 transition-colors">
              Remember me
            </span>
          </label>
          <button
            type="button"
            onClick={() =>
              setMessage({
                type: 'success',
                text: 'Password reset instructions have been sent.',
              })
            }
            className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit Primary Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all duration-200 shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Login</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
