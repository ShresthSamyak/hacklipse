import React from 'react';

export const VisualOpticsPanel: React.FC = () => {
  return (
    <section className="col-span-12 md:col-span-7 bg-surface-container-high p-8 flex flex-col justify-between min-h-[320px]">
      <div>
        <h2 className="text-sm font-headline font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">visibility</span> Visual Optics
        </h2>
        <div className="space-y-8">
          <div className="flex justify-between items-center group">
            <div>
              <p className="text-lg font-headline font-medium">Luminosity Mode</p>
              <p className="text-xs text-on-surface-variant font-body">Toggle between high-contrast dark and archival light interface.</p>
            </div>
            <div className="flex bg-surface-container-lowest p-1 border border-outline-variant/30">
              <button className="px-4 py-2 bg-primary text-black text-xs font-headline font-bold uppercase pointer-events-none">Dark</button>
              <button className="px-4 py-2 text-on-surface-variant text-xs font-headline font-bold uppercase hover:text-on-surface opacity-50 cursor-not-allowed" title="Not available in current security context">Light</button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-headline font-medium">Density Control</p>
              <p className="text-xs text-on-surface-variant font-body">Compact view for expert investigators.</p>
            </div>
            <div className="w-12 h-6 bg-surface-container-highest border border-outline-variant/50 flex items-center px-1 cursor-pointer">
              <div className="w-4 h-4 bg-primary"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-8 border-t border-outline-variant/20 flex items-center justify-between">
        <span className="text-[10px] font-mono text-on-surface-variant">GFX_ENGINE: VULKAN_STABLE</span>
        <span className="text-[10px] font-mono text-primary">UI_RENDER: 120FPS</span>
      </div>
    </section>
  );
};
