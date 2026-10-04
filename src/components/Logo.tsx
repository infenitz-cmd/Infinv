export const Logo: React.FC<{ size?: 'normal' | 'large' }> = ({ size = 'normal' }) => {
  return (
    <div className="flex items-center gap-3">
      {/* Wave / Ribbon Icon matching design */}
      <div className="relative w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-md shadow-blue-500/20">
        <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center overflow-hidden relative">
          <svg className="w-7 h-7" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M 8 28 C 8 18, 16 10, 24 10 C 30 10, 32 14, 28 20 C 24 26, 14 26, 12 30 C 10 34, 16 34, 24 30 C 32 26, 34 18, 30 12"
              stroke="url(#logoGrad)"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Brand Text & Tagline */}
      <div className="flex flex-col">
        <span className={`font-extrabold tracking-tight text-slate-900 leading-none ${size === 'large' ? 'text-3xl' : 'text-2xl'}`}>
          Infenitz
        </span>
        <span className="text-[12px] font-semibold tracking-wide text-slate-400 mt-1 uppercase">
          Build <span className="mx-1 text-slate-300">•</span> Learn <span className="mx-1 text-slate-300">•</span> Grow
        </span>
      </div>
    </div>
  );
};
