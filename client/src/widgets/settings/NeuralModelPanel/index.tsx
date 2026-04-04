import React from 'react';

export const NeuralModelPanel: React.FC = () => {
  return (
    <section className="col-span-12 md:col-span-8 bg-surface-container-highest p-8 relative overflow-hidden">
      <div className="relative z-10">
        <h2 className="text-sm font-headline font-bold uppercase tracking-widest text-primary mb-8 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">psychology</span> Neural Model Selection
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Model Card Active */}
          <div className="p-6 bg-surface-container-lowest border-l-4 border-primary">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-primary/20 text-primary text-[9px] font-bold px-2 py-0.5 tracking-tighter uppercase">Active</span>
              <span className="material-symbols-outlined text-primary text-xl">token</span>
            </div>
            <h3 className="font-headline font-bold text-lg uppercase leading-none mb-1 text-on-surface">Cerebro-9 Ultra</h3>
            <p className="text-[11px] text-on-surface-variant font-body mb-4">Optimized for complex cross-case contradiction detection.</p>
            <div className="flex gap-2">
              <span className="text-[9px] font-mono bg-surface-variant px-2 py-1 text-gray-300">200K CTX</span>
              <span className="text-[9px] font-mono bg-surface-variant px-2 py-1 text-gray-300">FP16</span>
            </div>
          </div>
          
          {/* Model Card Inactive */}
          <div className="p-6 bg-surface-container-low border border-outline-variant/30 hover:bg-surface-container transition-colors cursor-pointer group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-on-surface-variant text-[9px] font-bold px-2 py-0.5 tracking-tighter uppercase border border-outline-variant/50">Available</span>
              <span className="material-symbols-outlined text-on-surface-variant text-xl group-hover:text-tertiary transition-colors">bolt</span>
            </div>
            <h3 className="font-headline font-bold text-lg uppercase leading-none mb-1 text-gray-400 group-hover:text-tertiary transition-colors">Nexus-Lite v2</h3>
            <p className="text-[11px] text-on-surface-variant font-body mb-4">High-speed processing for real-time narrative stream mapping.</p>
            <div className="flex gap-2">
              <span className="text-[9px] font-mono bg-surface-container-lowest px-2 py-1 text-gray-500 border border-outline-variant/20">32K CTX</span>
              <span className="text-[9px] font-mono bg-surface-container-lowest px-2 py-1 text-gray-500 border border-outline-variant/20">INT8</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-headline uppercase tracking-wide text-gray-400">Temperature Variance</label>
            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 border border-primary/20">0.72</span>
          </div>
          {/* Custom style mapping tailwind raw slider to react style */}
          <input 
            className="w-full h-1 bg-surface-container-lowest appearance-none cursor-pointer outline-none slider-thumb-primary" 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            defaultValue="0.72" 
          />
          <style>{`
            .slider-thumb-primary::-webkit-slider-thumb {
              appearance: none;
              width: 12px;
              height: 12px;
              background: #a5e7ff;
            }
          `}</style>
        </div>
      </div>
      
      {/* Abstract neural visualization background */}
      <div className="absolute -right-20 -bottom-20 opacity-5 pointer-events-none text-primary">
        <svg height="400" viewBox="0 0 100 100" width="400">
          <circle cx="50" cy="50" fill="none" r="40" stroke="currentColor" strokeWidth="0.5"></circle>
          <circle cx="50" cy="50" fill="none" r="30" stroke="currentColor" strokeWidth="0.5"></circle>
          <circle cx="50" cy="50" fill="none" r="20" stroke="currentColor" strokeWidth="0.5"></circle>
          <line stroke="currentColor" strokeWidth="0.2" x1="10" x2="90" y1="50" y2="50"></line>
          <line stroke="currentColor" strokeWidth="0.2" x1="50" x2="50" y1="10" y2="90"></line>
        </svg>
      </div>
    </section>
  );
};
