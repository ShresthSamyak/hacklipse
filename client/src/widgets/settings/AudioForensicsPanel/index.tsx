import React from 'react';

export const AudioForensicsPanel: React.FC = () => {
  return (
    <section className="col-span-12 md:col-span-4 bg-surface-container p-8">
      <h2 className="text-sm font-headline font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">mic</span> Audio Forensics
      </h2>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-label uppercase text-on-surface-variant">Input Source</label>
          <select className="w-full bg-surface-container-lowest border-b border-outline-variant p-3 text-xs font-headline outline-none focus:border-primary transition-colors appearance-none text-on-surface">
            <option>INTEGRATED_ARRAY_01</option>
            <option>EXTERNAL_XLR_BETA</option>
            <option>VIRTUAL_STREAM_LINK</option>
          </select>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between text-[10px] font-label uppercase">
            <span className="text-gray-400">Input Gain</span>
            <span className="text-primary">-12.4dB</span>
          </div>
          <div className="h-1 bg-surface-container-highest w-full relative border border-outline-variant/30">
            <div className="absolute inset-y-0 left-0 bg-primary w-[65%]"></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-primary animate-pulse"></div>
          <span className="text-[10px] font-mono text-on-surface-variant">MONITORING ACTIVE</span>
        </div>
      </div>
    </section>
  );
};
