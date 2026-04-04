import React from 'react';

export const StatsRow: React.FC = () => {
  return (
    <div className="grid grid-cols-4 gap-px bg-outline-variant/20 mb-12">
      <div className="bg-surface-container-low p-6">
        <p className="font-label text-[10px] uppercase text-gray-500 tracking-widest mb-1">Total Cases</p>
        <p className="font-headline text-3xl font-bold text-primary">124</p>
      </div>
      <div className="bg-surface-container-low p-6">
        <p className="font-label text-[10px] uppercase text-gray-500 tracking-widest mb-1">Active Conflicts</p>
        <p className="font-headline text-3xl font-bold text-secondary">32</p>
      </div>
      <div className="bg-surface-container-low p-6">
        <p className="font-label text-[10px] uppercase text-gray-500 tracking-widest mb-1">Merge Rate</p>
        <p className="font-headline text-3xl font-bold text-tertiary">92.4%</p>
      </div>
      <div className="bg-surface-container-low p-6">
        <p className="font-label text-[10px] uppercase text-gray-500 tracking-widest mb-1">System Health</p>
        <p className="font-headline text-3xl font-bold text-primary">OPTIMAL</p>
      </div>
    </div>
  );
};
