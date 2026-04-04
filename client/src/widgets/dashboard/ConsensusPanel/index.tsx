import React from 'react';

export const ConsensusPanel: React.FC = () => {
  return (
    <section className="col-span-3 bg-surface-container-low flex flex-col p-4 border-l border-outline-variant/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-primary">Consensus Registry</h3>
        <span className="font-label text-[10px] text-gray-500">6 Conflicts / 12 Verified</span>
      </div>
      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
        {/* Branch Segment: Conflict */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2">
            <span className="font-label text-[10px] text-gray-400 uppercase">Segment #412 - Vehicle Color</span>
          </div>
          <div className="flex flex-col">
            <div className="bg-secondary-container/20 border-l-2 border-secondary p-2 text-xs font-body flex justify-between">
              <span className="text-secondary">- Witness B: Dark Grey</span>
              <span className="font-label text-[10px] text-secondary">DIFF</span>
            </div>
            <div className="bg-primary-container/10 border-l-2 border-primary p-2 text-xs font-body flex justify-between">
              <span className="text-primary">+ Witness A: Blue</span>
              <span className="font-label text-[10px] text-primary">MERGE?</span>
            </div>
          </div>
        </div>
        {/* Branch Segment: Confirmed */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2">
            <span className="font-label text-[10px] text-gray-400 uppercase">Segment #411 - Time Sync</span>
          </div>
          <div className="bg-surface-container-highest border-l-2 border-primary p-2 text-xs font-body flex items-center justify-between opacity-60">
            <span className="text-on-surface">Consensus: 14:21:00 EST</span>
            <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
        </div>
        {/* Branch Segment: Unknown */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2">
            <span className="font-label text-[10px] text-gray-400 uppercase">Segment #413 - Occupant Count</span>
          </div>
          <div className="bg-surface-variant p-2 text-xs font-body flex items-center justify-between italic text-gray-500">
            <span>Pending testimony triangulation...</span>
            <span className="material-symbols-outlined text-[14px]">hourglass_empty</span>
          </div>
        </div>
        {/* Visual Conflict Map */}
        <div className="mt-8 pt-8 border-t border-outline-variant/20">
          <h4 className="font-headline text-[10px] font-bold uppercase text-gray-400 mb-4 tracking-tighter">Narrative Branching Map</h4>
          <div className="flex h-32 gap-1 items-end">
            <div className="flex-grow bg-primary h-24 opacity-80" title="High Confidence"></div>
            <div className="flex-grow bg-primary h-20 opacity-60"></div>
            <div className="flex-grow bg-secondary h-12"></div>
            <div className="flex-grow bg-primary h-16 opacity-40"></div>
            <div className="flex-grow bg-tertiary h-28"></div>
            <div className="flex-grow bg-primary h-32"></div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="font-label text-[8px] text-gray-500 uppercase">Start</span>
            <span className="font-label text-[8px] text-gray-500 uppercase">Current</span>
          </div>
        </div>
      </div>
      {/* Footer Summary */}
      <div className="mt-auto pt-4">
        <button className="w-full bg-primary text-black font-headline text-xs font-black uppercase py-3 tracking-widest hover:brightness-110 active:scale-[0.98] transition-all">
          GENERATE REPORT
        </button>
      </div>
    </section>
  );
};
