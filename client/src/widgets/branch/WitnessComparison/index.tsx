import React from 'react';

export const WitnessComparison: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-outline-variant/20 flex-1 h-full min-h-[500px]">
      {/* Witness Branch V1 */}
      <div className="bg-surface-container-low p-6 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <div>
              <div className="font-headline font-bold text-lg uppercase leading-none text-on-surface">Witness_01</div>
              <div className="font-label text-[10px] text-primary uppercase tracking-tighter mt-1">Origin: Sector 7G</div>
            </div>
          </div>
          <div className="bg-primary/10 px-3 py-1 text-[10px] font-label text-primary uppercase tracking-widest">Active Branch v1.04</div>
        </div>
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-48 scrollbar-hide">
          <div className="bg-surface-container-highest p-5 flex flex-col gap-3 border-l-4 border-primary">
            <div className="flex justify-between items-start">
              <span className="font-label text-[10px] text-outline uppercase">TS: 02:14:05:22</span>
              <span className="material-symbols-outlined text-primary text-sm">verified</span>
            </div>
            <p className="font-body text-sm leading-relaxed text-on-surface">"I observed the vehicle entering the perimeter at approximately 0214 hours. It was a dark sedan, high-velocity approach. The gates failed to deploy."</p>
            <div className="bg-surface-container-lowest p-3 font-mono text-[11px] text-primary/70">
              LOG_ENTRY: GATE_FAILURE_DETECTED // SIG_INTERFERENCE_LVL_4
            </div>
          </div>
          <div className="bg-surface-container-highest p-5 flex flex-col gap-3 border-l-4 border-primary">
            <div className="flex justify-between items-start">
              <span className="font-label text-[10px] text-outline uppercase">TS: 02:15:12:01</span>
              <span className="material-symbols-outlined text-primary text-sm">verified</span>
            </div>
            <p className="font-body text-sm leading-relaxed text-on-surface">"The subject exited the vehicle through the driver side. Clad in tactical gear. Multiple weapon systems identified."</p>
          </div>
        </div>
      </div>

      {/* Witness Branch V2 */}
      <div className="bg-surface-container-low p-6 flex flex-col gap-6 relative">
        {/* Conflict Glow Overlay */}
        <div className="absolute inset-0 bg-secondary/5 pointer-events-none"></div>
        
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary">person</span>
            </div>
            <div>
              <div className="font-headline font-bold text-lg uppercase leading-none text-secondary">Witness_02</div>
              <div className="font-label text-[10px] text-secondary uppercase tracking-tighter mt-1">Origin: Sector 9A</div>
            </div>
          </div>
          <div className="bg-secondary/10 px-3 py-1 text-[10px] font-label text-secondary uppercase tracking-widest">Compare Branch v2.11</div>
        </div>
        
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-48 scrollbar-hide relative z-10">
          <div className="bg-surface-container-highest p-5 flex flex-col gap-3 border-l-4 border-outline">
            <div className="flex justify-between items-start">
              <span className="font-label text-[10px] text-outline uppercase">TS: 02:14:05:22</span>
            </div>
            <p className="font-body text-sm leading-relaxed text-on-surface">"Perimeter breach detected via thermal sensors. Vehicle type: Undetermined. Gate malfunction registered."</p>
          </div>

          <div className="bg-surface-container-highest p-5 flex flex-col gap-3 border-l-4 border-secondary ring-1 ring-secondary/20">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="font-label text-[10px] text-secondary uppercase">TS: 02:15:10:44</span>
                <span className="bg-secondary text-on-secondary px-1.5 py-0.5 text-[9px] font-bold uppercase">Conflict Detected</span>
              </div>
              <span className="material-symbols-outlined text-secondary text-sm">warning</span>
            </div>
            <p className="font-body text-sm leading-relaxed text-on-surface">"The driver remained in the vehicle. Passengers exited through rear doors. No weapons visible during initial scan."</p>
            <div className="bg-surface-container-lowest p-3 font-mono text-[11px] text-secondary/70">
              SCAN_DATA: PERS_COUNT_MISMATCH // AI_CERTAINTY: 42%
            </div>
            <div className="flex gap-2 mt-2">
              <button className="bg-secondary text-black px-3 py-2 text-[10px] font-label uppercase font-bold w-full hover:brightness-110 active:scale-[0.98]">
                Resolve Branch
              </button>
              <button className="border border-secondary/30 text-secondary px-3 py-2 text-[10px] font-label uppercase w-full hover:bg-secondary/10 active:scale-[0.98]">
                Flag for Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
