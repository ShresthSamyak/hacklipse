import React from 'react';

export const FinalCTA: React.FC = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5"></div>
      <div className="relative z-10 max-w-4xl mx-auto text-center px-6 space-y-12">
        <h2 className="text-4xl md:text-6xl font-headline font-bold tracking-tighter uppercase leading-none">
          Reality is a <span className="text-primary">puzzle</span>.<br/>
          We provide the <span className="text-primary">frame</span>.
        </h2>
        <div className="flex flex-col items-center gap-6">
          <button className="bg-primary text-black px-12 py-6 font-headline font-bold uppercase tracking-[0.2em] hover:brightness-110 shadow-[0_0_40px_rgba(165,231,255,0.1)] transition-all active:scale-95 border-none">
            Start Investigation
          </button>
          <div className="text-[10px] font-headline text-gray-500 uppercase tracking-widest flex items-center gap-4">
            <span className="w-8 h-[1px] bg-gray-800"></span>
            Encrypted Session Ready
            <span className="w-8 h-[1px] bg-gray-800"></span>
          </div>
        </div>
      </div>
    </section>
  );
};
