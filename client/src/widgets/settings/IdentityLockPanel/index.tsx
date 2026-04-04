import React from 'react';

export const IdentityLockPanel: React.FC = () => {
  return (
    <section className="col-span-12 md:col-span-5 bg-surface-container p-8 flex flex-col">
      <h2 className="text-sm font-headline font-bold uppercase tracking-widest text-tertiary mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">security</span> Identity Lock
      </h2>
      <div className="flex-1 flex flex-col justify-center items-center text-center py-4">
        <div className="w-20 h-20 bg-surface-container-highest border border-outline-variant/40 mb-4 flex items-center justify-center relative">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant">person</span>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary border-2 border-surface-container"></div>
        </div>
        <p className="font-headline font-bold uppercase tracking-tight text-on-surface">Investigator #8821</p>
        <p className="text-xs text-on-surface-variant font-mono mb-6">Level 4 Clearance</p>
        <button className="w-full py-3 border border-outline-variant text-[10px] font-headline font-bold uppercase hover:bg-surface-variant hover:text-white transition-all text-on-surface-variant tracking-widest">
          Rotate API Credentials
        </button>
      </div>
    </section>
  );
};
