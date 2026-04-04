import React from 'react';

export const OverlapHeatmap: React.FC = () => {
  return (
    <div className="col-span-12 bg-surface-container-low p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-label text-xs uppercase text-gray-400">Narrative Overlap Heatmap (Temporal)</h3>
        <div className="flex gap-2 text-[10px] font-label uppercase items-center">
          <span className="w-2 h-2 bg-primary"></span> Veracity
          <span className="w-2 h-2 bg-secondary ml-2"></span> Conflict
          <span className="w-2 h-2 bg-tertiary ml-2"></span> Ambiguity
        </div>
      </div>
      <div className="grid grid-cols-[repeat(24,_minmax(0,_1fr))] gap-1">
        {/* Generating a fake heatmap grid */}
        <div className="h-8 bg-primary opacity-20"></div>
        <div className="h-8 bg-primary opacity-40"></div>
        <div className="h-8 bg-primary opacity-60"></div>
        <div className="h-8 bg-primary opacity-80"></div>
        <div className="h-8 bg-primary opacity-100"></div>
        <div className="h-8 bg-primary opacity-80"></div>
        <div className="h-8 bg-secondary opacity-40"></div>
        <div className="h-8 bg-secondary opacity-60"></div>
        <div className="h-8 bg-secondary opacity-100"></div>
        <div className="h-8 bg-secondary opacity-100"></div>
        <div className="h-8 bg-secondary opacity-80"></div>
        <div className="h-8 bg-secondary opacity-40"></div>
        <div className="h-8 bg-tertiary opacity-40"></div>
        <div className="h-8 bg-tertiary opacity-80"></div>
        <div className="h-8 bg-primary opacity-20"></div>
        <div className="h-8 bg-primary opacity-40"></div>
        <div className="h-8 bg-primary opacity-60"></div>
        <div className="h-8 bg-primary opacity-40"></div>
        <div className="h-8 bg-primary opacity-20"></div>
        <div className="h-8 bg-surface-container-highest"></div>
        <div className="h-8 bg-surface-container-highest"></div>
        <div className="h-8 bg-surface-container-highest"></div>
        <div className="h-8 bg-surface-container-highest"></div>
        <div className="h-8 bg-surface-container-highest"></div>
      </div>
      <div className="mt-4 flex justify-between text-[10px] font-label text-gray-600 uppercase">
        <span>22:00:00</span>
        <span>22:30:00</span>
        <span>23:00:00 (Incident Peak)</span>
        <span>23:30:00</span>
        <span>00:00:00</span>
      </div>
    </div>
  );
};
