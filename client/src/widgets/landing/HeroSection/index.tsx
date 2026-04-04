import React from 'react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 px-6 overflow-hidden">
      {/* Abstract Graph Background Implied */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%]">
          <svg className="w-full h-full text-primary/30" fill="none" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 500 Q 250 100 500 500 T 900 500" stroke="currentColor" strokeWidth="0.5"></path>
            <path d="M100 300 Q 350 700 600 300 T 900 600" stroke="currentColor" strokeWidth="0.5"></path>
            <path d="M200 800 Q 500 200 800 800" stroke="currentColor" strokeWidth="0.5"></path>
            <circle cx="500" cy="500" fill="currentColor" r="2"></circle>
            <circle cx="250" cy="300" fill="currentColor" r="2"></circle>
            <circle cx="750" cy="650" fill="currentColor" r="2"></circle>
          </svg>
        </div>
      </div>
      <div className="relative z-10 max-w-5xl w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high border-l-2 border-primary">
          <span className="text-[0.65rem] font-headline uppercase tracking-widest text-primary">System Online: v1.0.42</span>
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
        </div>
        <h1 className="text-5xl md:text-8xl font-headline font-bold tracking-tight text-on-surface leading-none">
          Reconstruct reality.<br/>
          <span className="text-primary italic">Don’t assume it.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-on-surface-variant font-body leading-relaxed">
          A forensic AI narrative engine built to synthesize fragmented data, identify structural contradictions, and resolve complex informational warfare.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <button className="bg-primary text-black px-8 py-4 font-headline font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all w-full sm:w-auto">
            Start Investigation
          </button>
          <button className="border border-primary/30 text-primary px-8 py-4 font-headline font-bold uppercase tracking-widest hover:bg-primary/10 active:scale-95 transition-all w-full sm:w-auto">
            Access Public Dossier
          </button>
        </div>
      </div>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
        <span className="material-symbols-outlined text-primary/50 ">keyboard_double_arrow_down</span>
      </div>
    </section>
  );
};
