import React from 'react';

export const ConflictMetricsRow: React.FC = () => {
  return (
    <div className="col-span-12 lg:col-span-4 bg-surface-container-high p-6 flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="font-label text-xs uppercase text-gray-400 mb-6">Conflict Impact Score</h3>
        <div className="relative h-48 flex items-center justify-center">
          {/* Impact Gauge Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 border-8 border-surface-container-lowest rounded-full"></div>
            <div className="absolute w-40 h-40 border-8 border-secondary rounded-full border-t-transparent border-r-transparent rotate-[45deg]"></div>
            <div className="text-center">
              <span className="text-5xl font-black font-headline text-secondary leading-none">82</span>
              <p className="text-[10px] font-label uppercase text-secondary">Critical Shift</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-surface-container-lowest p-3">
          <p className="text-[10px] font-label uppercase text-gray-500">Inconsistencies</p>
          <p className="text-xl font-headline font-bold text-on-surface">14</p>
        </div>
        <div className="bg-surface-container-lowest p-3">
          <p className="text-[10px] font-label uppercase text-gray-500">Divergence Probability</p>
          <p className="text-xl font-headline font-bold text-tertiary">94.2%</p>
        </div>
      </div>
    </div>
  );
};
