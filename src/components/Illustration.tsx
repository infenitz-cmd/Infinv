import React from 'react';
import heroImg from '../assets/hero-illustration.jpg';

export const HeroIllustration: React.FC = () => {
  return (
    <div className="relative w-full max-w-xl flex items-center justify-center my-2 group">
      {/* Soft Ambient Glow under the illustration */}
      <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 via-cyan-400/20 to-indigo-400/20 rounded-3xl blur-xl pointer-events-none transform group-hover:scale-105 transition-transform duration-500" />

      {/* Main Illustration Image Frame */}
      <div className="relative z-10 w-full rounded-2xl overflow-hidden border border-slate-200/80 bg-white/70 backdrop-blur-xs shadow-md shadow-blue-500/5 p-2 sm:p-3 transition-transform duration-300 hover:scale-[1.01]">
        <img
          src={heroImg}
          alt="Infenitz Operations & Team Collaboration"
          className="w-full h-auto object-contain rounded-xl"
          loading="eager"
        />
      </div>
    </div>
  );
};
