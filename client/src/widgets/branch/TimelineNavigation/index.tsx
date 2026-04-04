import React from 'react';

export const TimelineNavigation: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-64 right-80 bg-surface-variant/60 backdrop-blur-xl border-t border-outline-variant/10 p-6 z-40">
      <div className="mx-auto flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div className="flex items-center gap-6">
            <button className="material-symbols-outlined text-primary hover:bg-primary/10 p-2">play_arrow</button>
            <div>
              <div className="font-label text-[10px] text-outline uppercase tracking-widest">Active Timeframe</div>
              <div className="font-headline font-bold text-xl text-primary tracking-tighter">02:15:11:00 / 04:00:00:00</div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 bg-surface-container flex items-center justify-center text-xs font-label text-primary border border-primary/20">1x</div>
            <div className="w-8 h-8 bg-surface-container-high flex items-center justify-center text-xs font-label text-outline border border-outline-variant/20 hover:text-primary transition-colors cursor-pointer">2x</div>
            <div className="w-8 h-8 bg-surface-container-high flex items-center justify-center text-xs font-label text-outline border border-outline-variant/20 hover:text-primary transition-colors cursor-pointer">4x</div>
          </div>
        </div>
        
        {/* Interactive Slider Track */}
        <div className="relative h-12 flex items-center">
          <div className="absolute inset-x-0 h-[1px] bg-outline-variant/30"></div>
          
          {/* Branch Segments */}
          <div className="absolute left-0 w-1/4 h-1 bg-primary/40"></div>
          <div className="absolute left-1/4 w-1/3 h-1 bg-secondary/40"></div>
          <div className="absolute left-[58.3%] w-1/6 h-1 bg-tertiary/40"></div>
          
          {/* Tick Marks */}
          <div className="absolute w-full h-full flex justify-between pointer-events-none items-center">
            <div className="w-px h-3 bg-outline-variant"></div>
            <div className="w-px h-3 bg-outline-variant"></div>
            <div className="w-px h-3 bg-outline-variant"></div>
            <div className="w-px h-3 bg-outline-variant"></div>
            <div className="w-px h-3 bg-outline-variant"></div>
            <div className="w-px h-3 bg-outline-variant"></div>
            <div className="w-px h-3 bg-outline-variant"></div>
            <div className="w-px h-3 bg-outline-variant"></div>
          </div>
          
          {/* Conflict Markers */}
          <div className="absolute left-[42%] w-2 h-2 bg-secondary rotate-45" title="Narrative Conflict"></div>
          <div className="absolute left-[44%] w-2 h-2 bg-secondary rotate-45" title="Narrative Conflict"></div>
          <div className="absolute left-[82%] w-2 h-2 bg-tertiary rotate-45" title="AI Insight"></div>
          
          {/* Playhead */}
          <div className="absolute left-1/3 w-px h-16 bg-primary z-10 shadow-[0_0_15px_rgba(165,231,255,0.8)] flex flex-col items-center">
            <div className="w-3 h-3 bg-primary rotate-45 mt-[-6px]"></div>
            <div className="mt-14 bg-primary text-black px-1 text-[8px] font-bold">LOCKED</div>
          </div>
        </div>
      </div>
    </div>
  );
};
