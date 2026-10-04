import { LogOut, User, CheckCircle2, ShieldCheck, Database, Sparkles } from 'lucide-react';
import { Logo } from './Logo';
import { isSupabaseConfigured } from '../lib/supabase';

interface DashboardProps {
  userEmail: string;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userEmail, onLogout }) => {
  return (
    <div className="w-full max-w-4xl bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-slate-100 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-slate-100">
        <Logo size="normal" />
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="py-10 text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 text-blue-600 ring-8 ring-blue-50/50 shadow-inner">
          <User className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back to Infenitz!
          </h2>
          <p className="text-slate-500 font-semibold text-sm mt-1">
            Logged in as <span className="text-blue-600 font-bold">{userEmail}</span>
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Authenticated</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Supabase: {isSupabaseConfigured ? 'Connected' : 'Demo Mode'}</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Type Safe (TypeScript)</span>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/60 border border-slate-200/80 text-left hover:shadow-md transition-all">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Build</h3>
            <p className="text-xs text-slate-500 mt-1">Start crafting your features with React & TypeScript.</p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/60 border border-slate-200/80 text-left hover:shadow-md transition-all">
            <div className="w-9 h-9 rounded-xl bg-cyan-600 text-white flex items-center justify-center mb-3">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Learn</h3>
            <p className="text-xs text-slate-500 mt-1">Explore Supabase Database & Auth SDK capabilities.</p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/60 border border-slate-200/80 text-left hover:shadow-md transition-all">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Grow</h3>
            <p className="text-xs text-slate-500 mt-1">Scale your modern app with automated cloud database.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
