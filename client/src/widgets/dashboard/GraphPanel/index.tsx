import React from 'react';

export const GraphPanel: React.FC = () => {
  return (
    <section className="col-span-6 bg-surface-container-lowest relative flex items-center justify-center overflow-hidden">
      {/* Background Map/Tech Grid */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none" 
        data-alt="abstract dark architectural blueprint layout with glowing cyan lines and geometric shapes" 
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBeJdCOeGjJRVGmq5SoUhF48CbUvp4aBnm88K0az3hhzoV8l6NHvzRsFZb3Ny32qr8zvL0vQa-S-auBwGv-1Zc-MIAaEKmdiHqj0ZBDOvo4uzHqhnJuDagqN0OLZtYvbK_y8a5e_m1fSlBP7tjT_WJgzX0iy_mXF2KKNDvBsjvyeFSUJsKWbTse3MMd83maf3ZxyEwT8MQSZXCQMkgoCK1RB2adpwL1frzUPgowD8ZVM3qXoVJcNZuMAWK9cwgYZ_wJxJrhotkX1nM')", backgroundSize: 'cover', mixBlendMode: 'overlay' }}
      ></div>
      {/* Graph Controls */}
      <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
        <button className="bg-surface-container-highest p-2 text-primary hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center">
          <span className="material-symbols-outlined">add</span>
        </button>
        <button className="bg-surface-container-highest p-2 text-primary hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center">
          <span className="material-symbols-outlined">remove</span>
        </button>
        <button className="bg-surface-container-highest p-2 text-primary hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center">
          <span className="material-symbols-outlined">center_focus_weak</span>
        </button>
      </div>
      {/* Visual Nodes (Simulated) */}
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Central Node */}
        <div className="relative z-20">
          <div className="w-32 h-32 border-2 border-primary/40 flex flex-col items-center justify-center bg-surface-container/80 backdrop-blur-md">
            <span className="font-label text-[10px] text-primary uppercase">Event Alpha</span>
            <span className="font-headline text-xl font-bold">14:21</span>
            <span className="font-label text-[10px] text-gray-500">Intersection 04</span>
          </div>
          {/* Connecting Lines */}
          <div className="absolute top-1/2 left-full w-48 h-px bg-gradient-to-r from-primary to-transparent"></div>
          <div className="absolute top-1/2 right-full w-48 h-px bg-gradient-to-l from-primary to-transparent"></div>
          <div className="absolute bottom-full left-1/2 w-px h-32 bg-gradient-to-t from-primary to-transparent"></div>
        </div>
        {/* Conflict Node */}
        <div className="absolute top-1/4 right-1/4 z-20">
          <div className="w-24 h-24 border-2 border-secondary bg-secondary-container/10 flex flex-col items-center justify-center backdrop-blur-sm">
            <span className="font-label text-[10px] text-secondary uppercase font-black">Conflict</span>
            <span className="font-headline text-lg text-white">Route B</span>
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          </div>
        </div>
        {/* Confirmed Node */}
        <div className="absolute bottom-1/4 left-1/4 z-20">
          <div className="w-24 h-24 border-2 border-primary bg-primary-container/10 flex flex-col items-center justify-center backdrop-blur-sm">
            <span className="font-label text-[10px] text-primary uppercase font-black">Verified</span>
            <span className="font-headline text-lg text-white">Entry point</span>
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
        </div>
      </div>
      {/* Bottom Bar: AI Suggestion */}
      <div className="absolute bottom-0 w-full p-6">
        <div className="bg-tertiary-container/10 border-l-4 border-tertiary p-4 flex items-center justify-between glow-sm backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="bg-tertiary text-on-tertiary p-2 flex items-center justify-center">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
            </div>
            <div>
              <h4 className="font-headline text-xs font-bold uppercase text-tertiary">Next Best Question</h4>
              <p className="font-body text-sm text-on-surface">"Ask Witness B to describe the driver's silhouette relative to the left turn signal."</p>
            </div>
          </div>
          <button className="font-label text-xs uppercase font-bold text-tertiary px-4 py-2 border border-tertiary/40 hover:bg-tertiary hover:text-on-tertiary transition-all">Execute Probe</button>
        </div>
      </div>
    </section>
  );
};
