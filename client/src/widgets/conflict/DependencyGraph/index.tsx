import React from 'react';

export const DependencyGraph: React.FC = () => {
  return (
    <div className="col-span-12 lg:col-span-8 bg-surface-container-high p-6 relative overflow-hidden">
      <h3 className="font-label text-xs uppercase text-gray-400 mb-4">Branch Dependency Graph</h3>
      <div className="h-64 relative bg-surface-container-lowest flex items-center justify-center">
        {/* Faux Graph UI */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #3c494e 1px, transparent 0)', backgroundSize: '24px 24px' }}
        ></div>
        <div className="relative z-10 w-full h-full p-4 flex items-center justify-around">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-primary/20 border border-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">source</span>
            </div>
            <span className="text-[8px] font-label uppercase text-primary">Source_A</span>
          </div>
          <div className="h-px w-24 bg-gradient-to-r from-primary via-secondary to-tertiary"></div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 bg-secondary/20 border-2 border-secondary flex items-center justify-center outline outline-4 outline-secondary/10">
              <span className="material-symbols-outlined text-secondary text-3xl">hub</span>
            </div>
            <span className="text-[8px] font-label uppercase text-secondary font-bold">Conflict_Node_X</span>
          </div>
          <div className="h-px w-24 bg-surface-variant"></div>
          <div className="flex flex-col items-center gap-2 opacity-40">
            <div className="w-12 h-12 bg-surface-variant border border-outline flex items-center justify-center">
              <span className="material-symbols-outlined text-outline">account_tree</span>
            </div>
            <span className="text-[8px] font-label uppercase text-outline">Terminal_B</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-4">
        <span className="bg-secondary/10 text-secondary border border-secondary/30 px-2 py-1 text-[10px] font-label uppercase">Temporal Anomaly Detected</span>
        <span className="bg-tertiary/10 text-tertiary border border-tertiary/30 px-2 py-1 text-[10px] font-label uppercase">Logic Discrepancy</span>
      </div>
    </div>
  );
};
