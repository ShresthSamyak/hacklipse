import React from 'react';

export const CaseGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Case Card 1 */}
      <div className="bg-surface-container-high hover:bg-surface-container-highest transition-colors group relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
        <div className="p-6 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="font-label text-[10px] text-primary uppercase tracking-[0.2em] mb-2 block">Case ID: #772-OMEGA</span>
              <h3 className="font-headline text-xl font-bold uppercase leading-tight group-hover:text-primary transition-colors">The Lazarus Discrepancy</h3>
            </div>
            <span className="bg-primary/10 text-primary px-2 py-1 font-label text-[9px] uppercase font-bold border border-primary/20">Open</span>
          </div>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between font-label text-[10px] uppercase text-gray-400">
              <span>Evidence Branches</span>
              <span className="text-on-surface">08 Units</span>
            </div>
            <div className="flex justify-between font-label text-[10px] uppercase text-gray-400">
              <span>Conflict Density</span>
              <span className="text-secondary font-bold">12 Discrepancies</span>
            </div>
          </div>
          {/* Progress Bar Component */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="font-label text-[9px] uppercase tracking-widest text-gray-500">Analysis Progress</span>
              <span className="font-label text-[9px] text-primary font-bold">68%</span>
            </div>
            <div className="h-1 bg-surface-container-lowest w-full relative">
              <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: '68%' }}></div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 border border-outline-variant py-2 font-headline text-[10px] uppercase tracking-widest hover:bg-on-surface hover:text-surface transition-colors">View Dossier</button>
            <button className="w-12 border border-outline-variant flex items-center justify-center hover:bg-secondary/10 hover:text-secondary transition-colors">
              <span className="material-symbols-outlined text-sm" data-icon="more_horiz">more_horiz</span>
            </button>
          </div>
        </div>
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      {/* Case Card 2 */}
      <div className="bg-surface-container-high hover:bg-surface-container-highest transition-colors group relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
        <div className="p-6 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="font-label text-[10px] text-secondary uppercase tracking-[0.2em] mb-2 block">Case ID: #441-THETA</span>
              <h3 className="font-headline text-xl font-bold uppercase leading-tight group-hover:text-secondary transition-colors">Ghost Signal Protocol</h3>
            </div>
            <span className="bg-secondary/10 text-secondary px-2 py-1 font-label text-[9px] uppercase font-bold border border-secondary/20">Critical</span>
          </div>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between font-label text-[10px] uppercase text-gray-400">
              <span>Evidence Branches</span>
              <span className="text-on-surface">14 Units</span>
            </div>
            <div className="flex justify-between font-label text-[10px] uppercase text-gray-400">
              <span>Conflict Density</span>
              <span className="text-secondary font-bold">03 Discrepancies</span>
            </div>
          </div>
          {/* Progress Bar Component */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="font-label text-[9px] uppercase tracking-widest text-gray-500">Analysis Progress</span>
              <span className="font-label text-[9px] text-secondary font-bold">85%</span>
            </div>
            <div className="h-1 bg-surface-container-lowest w-full relative">
              <div className="absolute top-0 left-0 h-full bg-secondary" style={{ width: '85%' }}></div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 border border-outline-variant py-2 font-headline text-[10px] uppercase tracking-widest hover:bg-on-surface hover:text-surface transition-colors">View Dossier</button>
            <button className="w-12 border border-outline-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-sm" data-icon="more_horiz">more_horiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* Case Card 3 (Intelligence Warning) */}
      <div className="bg-surface-container-high hover:bg-surface-container-highest transition-colors group relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-tertiary"></div>
        <div className="p-6 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="font-label text-[10px] text-tertiary uppercase tracking-[0.2em] mb-2 block">Case ID: #902-SIGMA</span>
              <h3 className="font-headline text-xl font-bold uppercase leading-tight group-hover:text-tertiary transition-colors">Shadow Net Nexus</h3>
            </div>
            <span className="bg-tertiary/10 text-tertiary px-2 py-1 font-label text-[9px] uppercase font-bold border border-tertiary/20">Awaiting AI</span>
          </div>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between font-label text-[10px] uppercase text-gray-400">
              <span>Evidence Branches</span>
              <span className="text-on-surface">22 Units</span>
            </div>
            <div className="flex justify-between font-label text-[10px] uppercase text-gray-400">
              <span>Conflict Density</span>
              <span className="text-secondary font-bold">41 Discrepancies</span>
            </div>
          </div>
          {/* Progress Bar Component */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="font-label text-[9px] uppercase tracking-widest text-gray-500">Analysis Progress</span>
              <span className="font-label text-[9px] text-tertiary font-bold">12%</span>
            </div>
            <div className="h-1 bg-surface-container-lowest w-full relative">
              <div className="absolute top-0 left-0 h-full bg-tertiary" style={{ width: '12%' }}></div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 border border-outline-variant py-2 font-headline text-[10px] uppercase tracking-widest hover:bg-on-surface hover:text-surface transition-colors">View Dossier</button>
            <button className="w-12 border border-outline-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-sm" data-icon="more_horiz">more_horiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* Case Card 4 */}
      <div className="bg-surface-container-high hover:bg-surface-container-highest transition-colors group relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
        <div className="p-6 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="font-label text-[10px] text-primary uppercase tracking-[0.2em] mb-2 block">Case ID: #331-BETA</span>
              <h3 className="font-headline text-xl font-bold uppercase leading-tight group-hover:text-primary transition-colors">Amnesia Logic Core</h3>
            </div>
            <span className="bg-primary/10 text-primary px-2 py-1 font-label text-[9px] uppercase font-bold border border-primary/20">Open</span>
          </div>
          <div className="space-y-4 mb-8">
            <div className="flex justify-between font-label text-[10px] uppercase text-gray-400">
              <span>Evidence Branches</span>
              <span className="text-on-surface">05 Units</span>
            </div>
            <div className="flex justify-between font-label text-[10px] uppercase text-gray-400">
              <span>Conflict Density</span>
              <span className="text-secondary font-bold">01 Discrepancies</span>
            </div>
          </div>
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="font-label text-[9px] uppercase tracking-widest text-gray-500">Analysis Progress</span>
              <span className="font-label text-[9px] text-primary font-bold">95%</span>
            </div>
            <div className="h-1 bg-surface-container-lowest w-full relative">
              <div className="absolute top-0 left-0 h-full bg-primary" style={{ width: '95%' }}></div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 border border-outline-variant py-2 font-headline text-[10px] uppercase tracking-widest hover:bg-on-surface hover:text-surface transition-colors">View Dossier</button>
            <button className="w-12 border border-outline-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-sm" data-icon="more_horiz">more_horiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* Placeholder for New Case */}
      <div className="border-2 border-dashed border-outline-variant flex flex-col items-center justify-center p-12 text-gray-500 hover:border-primary hover:text-primary transition-all group cursor-pointer">
        <span className="material-symbols-outlined text-4xl mb-4 group-hover:scale-110 transition-transform" data-icon="add_circle">add_circle</span>
        <p className="font-headline font-bold uppercase text-xs tracking-[0.3em]">Initialize New Dossier</p>
        <p className="font-label text-[10px] mt-2 opacity-50 uppercase tracking-widest">Awaiting Command Input...</p>
      </div>
    </div>
  );
};
