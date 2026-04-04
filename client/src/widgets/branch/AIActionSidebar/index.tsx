import React from 'react';

export const AIActionSidebar: React.FC = () => {
  return (
    <div className="fixed right-0 top-16 bottom-0 w-80 bg-surface-container-low border-l border-outline-variant/10 p-6 flex flex-col gap-6 z-30">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-tertiary">psychology</span>
        <h3 className="font-headline font-bold uppercase text-sm tracking-widest text-tertiary">AI Forensic Log</h3>
      </div>
      
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-6 scrollbar-hide">
        <div className="bg-surface-container-lowest p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label text-[9px] text-outline uppercase tracking-widest">Inference Engine</span>
            <span className="text-[9px] font-mono text-tertiary">02:15:10</span>
          </div>
          <p className="font-body text-[12px] leading-relaxed text-on-surface-variant">
            Scanning witness branch discrepancies. Mismatch identified in 'Subject_Exit_Vector'. Witness_01 probability: 76%. Witness_02 probability: 24%.
          </p>
        </div>
        
        <div className="bg-surface-container-lowest p-4 opacity-50">
          <div className="flex justify-between items-center mb-2">
            <span className="font-label text-[9px] text-outline uppercase tracking-widest">Object Tracking</span>
            <span className="text-[9px] font-mono text-outline">02:14:55</span>
          </div>
          <p className="font-body text-[12px] leading-relaxed text-on-surface-variant">
            Vehicle classified as SUV. Thermal signature matches model: Blackwood_V8. Persistence: Stable.
          </p>
        </div>
        
        {/* Bento-style data snippet */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-primary/5 p-3 flex flex-col">
            <span className="font-label text-[8px] text-primary uppercase">Confidence</span>
            <span className="font-headline font-bold text-lg text-primary">High</span>
          </div>
          <div className="bg-secondary/5 p-3 flex flex-col">
            <span className="font-label text-[8px] text-secondary uppercase">Entropy</span>
            <span className="font-headline font-bold text-lg text-secondary">0.14</span>
          </div>
        </div>
      </div>
      
      <button className="w-full bg-primary text-black py-3 font-headline font-bold uppercase text-xs tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 active:scale-95">
        <span className="material-symbols-outlined text-sm">auto_fix_high</span>
        Merge Verified Nodes
      </button>
    </div>
  );
};
