import React from 'react';

export const NarrativeSplitScreen: React.FC = () => {
  return (
    <div className="col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-px bg-outline-variant">
      {/* Side A: Original Narrative */}
      <div className="bg-surface-container-high p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-primary"></div>
            <div>
              <h4 className="font-headline font-bold uppercase tracking-tight">Narrative Alpha</h4>
              <p className="text-[10px] font-label text-primary uppercase">Hash: 0x992..F1A</p>
            </div>
          </div>
          <span className="text-[10px] font-label uppercase text-gray-500">Confidence: 91%</span>
        </div>
        <div className="space-y-4 font-body text-sm leading-relaxed text-gray-300">
          <p>Subject observed entering the perimeter at <span className="text-primary font-mono">22:41:03</span>. No thermal anomalies were recorded by the northern sector array. Narrative suggests a direct approach to the main vault via the service corridor.</p>
          <div className="p-4 bg-surface-container-lowest border-l-2 border-primary/40">
            <p className="text-xs italic opacity-80">"The entry was silent, bypassing sensors B-4 and B-5 without triggering the standard cascade protocols."</p>
          </div>
          <p>Visual corroboration remains high through secondary optics. Metadata aligns with standard investigative protocols established in Dossier v.0.8.</p>
        </div>
      </div>
      
      {/* Side B: Conflict Narrative */}
      <div className="bg-surface-container-high p-8 relative">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-secondary"></div>
            <div>
              <h4 className="font-headline font-bold uppercase tracking-tight text-secondary">Narrative Gamma</h4>
              <p className="text-[10px] font-label text-secondary uppercase">Hash: 0x44B..88X</p>
            </div>
          </div>
          <span className="text-[10px] font-label uppercase text-secondary font-bold">Conflict Rank: High</span>
        </div>
        <div className="space-y-4 font-body text-sm leading-relaxed text-gray-300">
          <p>Subject recorded in <span className="bg-secondary/20 text-secondary px-1 border-b border-secondary">multiple locations simultaneously</span> at 22:41:03. Sector array reports high-frequency interference consistent with narrative cloaking or temporal fragmentation.</p>
          <div className="p-4 bg-secondary-container/10 border-l-2 border-secondary">
            <p className="text-xs italic text-secondary-fixed">"Sensors B-4 triggered a phantom alarm while Subject was physically verified in the southern loading bay."</p>
          </div>
          <p>AI Forensic model flags this as a <span className="text-secondary font-bold">Primary Contradiction</span>. Logic depth suggests external data injection or a high-level system breach.</p>
        </div>
        {/* Overlay Conflict Chip */}
        <div className="absolute top-4 right-4 bg-secondary-container text-on-secondary-container px-3 py-1 text-[10px] font-bold font-label uppercase tracking-tighter">
          Logic Conflict #004
        </div>
      </div>
    </div>
  );
};
