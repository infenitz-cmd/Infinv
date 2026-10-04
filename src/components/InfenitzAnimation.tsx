import React from 'react';

export const InfenitzAnimation: React.FC = () => {
  const ribbonPath =
    'M 8 28 C 8 18, 16 10, 24 10 C 30 10, 32 14, 28 20 C 24 26, 14 26, 12 30 C 10 34, 16 34, 24 30 C 32 26, 34 18, 30 12';

  return (
    <div className="w-full mt-4 flex items-center justify-center">
      <div className="relative w-full max-w-4xl rounded-3xl bg-gradient-to-b from-white via-slate-50/70 to-blue-50/30 border border-slate-200/80 shadow-md shadow-blue-500/5 py-14 sm:py-20 px-6 sm:px-12 overflow-hidden flex flex-col items-center justify-center">
        {/* Ambient Backlight Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ========================================================================= */}
        {/* CENTERPIECE: INFENITZ INFINITY LOGO IN CONTINUOUS LOOP */}
        {/* ========================================================================= */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {/* Outer Orbital Ring 1 with Rotating Energy Nodes */}
          <div
            className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full border border-blue-300/30 pointer-events-none animate-spin"
            style={{ animationDuration: '18s' }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/60 border-2 border-white" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-md shadow-cyan-400/60 border-2 border-white" />
          </div>

          {/* Inner Orbital Ring 2 (Counter-Clockwise Dashed) */}
          <div
            className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border-2 border-dashed border-cyan-400/40 pointer-events-none animate-spin"
            style={{
              animationDuration: '12s',
              animationDirection: 'reverse'
            }}
          >
            <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/60 border-2 border-white" />
            <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-400 shadow-md shadow-blue-400/60 border border-white" />
          </div>

          {/* Innermost Ambient Breathing Glow */}
          <div className="absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-blue-500/10 via-cyan-400/15 to-indigo-500/10 pointer-events-none animate-infenitz-glow" />

          {/* Floating Glassmorphic Logo Shield */}
          <div className="relative z-10 animate-infenitz-float">
            {/* Multi-layered Backing Shadow Halo */}
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 blur-2xl opacity-45" />

            {/* Main Glass Icon Container */}
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-white/95 backdrop-blur-md p-1 border-2 border-white shadow-2xl shadow-blue-600/20 flex items-center justify-center transition-transform duration-500 hover:scale-105">
              <div className="w-full h-full rounded-[20px] bg-gradient-to-tr from-slate-50 via-white to-blue-50/50 flex items-center justify-center overflow-hidden relative">
                {/* Subtle Geometric Background Watermark Grid */}
                <div
                  className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, #000 1px, transparent 0)',
                    backgroundSize: '12px 12px'
                  }}
                />

                {/* Main Vector SVG Logo with Flowing Neon Dash and Orbiting Comet */}
                <svg
                  className="w-24 h-24 sm:w-28 sm:h-28 overflow-visible"
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    {/* Primary Ribbon Gradient */}
                    <linearGradient id="infenitzMainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1d4ed8" />
                      <stop offset="45%" stopColor="#2563eb" />
                      <stop offset="75%" stopColor="#0284c7" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>

                    {/* Laser Flow Gradient */}
                    <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                      <stop offset="50%" stopColor="#67e8f9" stopOpacity="1" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.8" />
                    </linearGradient>

                    {/* Comet Particle Glow Filter */}
                    <filter id="cometGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Layer 1: Ambient Glowing Blur Underneath */}
                  <path
                    d={ribbonPath}
                    stroke="url(#infenitzMainGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.35"
                    className="animate-infenitz-glow"
                  />

                  {/* Layer 2: Main Solid Ribbon Path */}
                  <path
                    d={ribbonPath}
                    stroke="url(#infenitzMainGrad)"
                    strokeWidth="5.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Layer 3: Kinetic Flowing Neon Pulse Line (Continuous Loop) */}
                  <path
                    d={ribbonPath}
                    stroke="url(#laserGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="animate-infenitz-dash"
                  />

                  {/* Layer 4: Orbiting Energy Comet Light gliding infinitely along the exact ribbon path */}
                  <g>
                    <circle r="2.2" fill="#ffffff" filter="url(#cometGlow)">
                      <animateMotion path={ribbonPath} dur="3.2s" repeatCount="indefinite" />
                    </circle>
                    <circle r="1.2" fill="#06b6d4">
                      <animateMotion path={ribbonPath} dur="3.2s" repeatCount="indefinite" />
                    </circle>
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* Typography and Tagline with Kinetic Shimmer */}
          <div className="text-center mt-7 space-y-2 z-10">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-500 animate-infenitz-shimmer">
              Infenitz
            </h2>
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="px-3.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-black tracking-wider uppercase shadow-xs">
                Build
              </span>
              <span className="text-slate-300 font-black">•</span>
              <span className="px-3.5 py-1 rounded-full bg-cyan-100 text-cyan-800 text-xs font-black tracking-wider uppercase shadow-xs">
                Learn
              </span>
              <span className="text-slate-300 font-black">•</span>
              <span className="px-3.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-black tracking-wider uppercase shadow-xs">
                Grow
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
