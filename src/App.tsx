import { useState } from 'react';
import { Logo } from './components/Logo';
import { HeroIllustration } from './components/Illustration';
import { FeatureBadges } from './components/FeatureBadges';
import { LoginForm } from './components/LoginForm';
import { HomePage } from './components/HomePage';
import { getStoredUsers } from './lib/userStore';

export function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('infenitz_current_user');
      if (!stored) return null;
      const validUsers = getStoredUsers();
      const match = validUsers.find(
        (u) =>
          (u.username.toLowerCase() === stored.toLowerCase() ||
            (u.email && u.email.toLowerCase() === stored.toLowerCase())) &&
          u.status === 'Active'
      );
      if (!match) {
        localStorage.removeItem('infenitz_current_user');
        localStorage.removeItem('infenitz_current_role');
        return null;
      }
      return match.username;
    } catch {
      return null;
    }
  });

  const handleLoginSuccess = (username: string) => {
    try {
      localStorage.setItem('infenitz_current_user', username);
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(username);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('infenitz_current_user');
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
  };

  return (
    <>
      {currentUser ? (
        <HomePage username={currentUser} onLogout={handleLogout} />
      ) : (
        <div className="min-h-screen w-full bg-gradient-to-br from-[#eaf2ff] via-[#f2f7ff] to-[#f8fafc] flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden">
          {/* Background Soft Floating Ambient Glow Orbs */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Main Login Container */}
          <div className="w-full max-w-6xl z-10 flex items-center justify-center">
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              
              {/* Left Hero Section */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6 py-2 px-2 sm:px-4">
                {/* Brand Header */}
                <div className="pt-2">
                  <Logo size="large" />
                </div>

                {/* Main Headline */}
                <div className="space-y-3 pt-2">
                  <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                    Welcome Back!
                  </h1>
                  <p className="text-slate-500 font-medium text-base sm:text-lg max-w-md">
                    Log in to your account and continue your journey.
                  </p>
                </div>

                {/* Illustration */}
                <div className="w-full flex justify-center items-center py-2">
                  <HeroIllustration />
                </div>

                {/* 3 Feature Pills at Bottom */}
                <div className="w-full max-w-xl">
                  <FeatureBadges />
                </div>
              </div>

              {/* Right Card Section */}
              <div className="lg:col-span-5 w-full flex items-center justify-center">
                <LoginForm onSuccess={handleLoginSuccess} />
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
