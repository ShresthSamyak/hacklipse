import React from 'react';
import { ConflictMetricsRow } from '@/widgets/conflict/ConflictMetricsRow';
import { DependencyGraph } from '@/widgets/conflict/DependencyGraph';
import { NarrativeSplitScreen } from '@/widgets/conflict/NarrativeSplitScreen';
import { OverlapHeatmap } from '@/widgets/conflict/OverlapHeatmap';
import { EvidenceTable } from '@/widgets/conflict/EvidenceTable';

const ConflictExplorerPage: React.FC = () => {
  return (
    <main className="pt-16 p-8 min-h-screen relative overflow-x-hidden">
      {/* Noise overlay specific to Conflict Explorer */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999]" 
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }}
      ></div>

      {/* Header & Controls */}
      <div className="flex justify-between items-end mb-8 relative z-10">
        <div>
          <span className="text-tertiary font-label text-xs uppercase tracking-widest mb-1 block">Active Investigation / Node-882</span>
          <h1 className="text-4xl font-black font-headline tracking-tighter uppercase leading-none">Conflict Explorer</h1>
        </div>
        <div className="flex gap-4">
          <button className="bg-surface-container-high px-4 py-2 text-xs font-label uppercase hover:bg-surface-variant transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">filter_list</span> Filter Signals
          </button>
          <button className="bg-primary text-black px-6 py-2 text-xs font-bold font-label uppercase hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">merge</span> Resolve Narrative
          </button>
        </div>
      </div>

      {/* Dashboard Layout: Bento Grid */}
      <div className="grid grid-cols-12 gap-6 relative z-10 pb-24">
        <ConflictMetricsRow />
        <DependencyGraph />
        <NarrativeSplitScreen />
        <OverlapHeatmap />
        <EvidenceTable />
      </div>

      {/* Security Alert FAB */}
      <div className="fixed bottom-0 right-0 p-8 pointer-events-none z-50">
        <div className="bg-surface-container-high border-t-2 border-secondary p-4 w-64 shadow-2xl pointer-events-auto">
          <h5 className="text-[10px] font-label text-secondary uppercase font-bold mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-xs">notifications_active</span> Security Alert
          </h5>
          <p className="text-xs text-gray-400">Potential data injection detected at Node-882. Recommend manual narrative isolation.</p>
        </div>
      </div>
    </main>
  );
};

export default ConflictExplorerPage;
