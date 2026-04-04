import React from 'react';

export const BranchHeader: React.FC = () => {
  return (
    <div className="flex justify-between items-end border-b border-outline-variant/10 pb-6">
      <div>
        <h1 className="font-headline text-4xl font-bold tracking-tight uppercase">Branch Analysis: <span className="text-primary">Case_772_Alpha</span></h1>
        <p className="font-body text-outline text-sm mt-2 max-w-2xl">
          Synchronized witness testimony comparison. Detecting narrative divergence in high-velocity data streams.
        </p>
      </div>
      <div className="flex gap-4">
        <div className="bg-surface-container-high p-4 flex flex-col min-w-[120px]">
          <span className="font-label text-[10px] text-tertiary uppercase tracking-widest">Conflicts</span>
          <span className="font-headline text-2xl font-bold text-on-surface">14</span>
        </div>
        <div className="bg-surface-container-high p-4 flex flex-col min-w-[120px]">
          <span className="font-label text-[10px] text-primary uppercase tracking-widest">Reliability</span>
          <span className="font-headline text-2xl font-bold text-on-surface">88.2%</span>
        </div>
      </div>
    </div>
  );
};
