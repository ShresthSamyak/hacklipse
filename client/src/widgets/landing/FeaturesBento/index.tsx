import React from 'react';

export const FeaturesBento: React.FC = () => {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="mb-16 space-y-4">
        <h2 className="text-xs font-headline text-primary tracking-[0.5em] uppercase">Forensic Capabilities</h2>
        <div className="text-4xl font-headline font-bold text-on-surface">The Intelligence Suite</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Feature 1: Graph Vis */}
        <div className="md:col-span-8 bg-surface-container p-8 space-y-8 flex flex-col justify-between border-t border-primary/20">
          <div className="space-y-4">
            <span className="material-symbols-outlined text-primary text-4xl ">hub</span>
            <h3 className="text-2xl font-headline font-bold uppercase">Dynamic Graph Visualization</h3>
            <p className="text-on-surface-variant max-w-xl">
              See the connections that aren't meant to be seen. Our neural graph engine visualizes relationships between entities, events, and locations in real-time.
            </p>
          </div>
          <div className="relative h-64 w-full bg-surface-container-lowest overflow-hidden">
            <img className="w-full h-full object-cover opacity-40 mix-blend-screen" alt="Abstract network pattern" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeIjsLRTFWnjvmdM1bdwpLIp-meDrDu6VClQpmendHB9AwWpvkK6BPaPkH0m4CsjflW3aeDz5HSnQZj5cKuu6MuDwIeFDeDOkWk4XGCPe1BAryOOJexgkc4c8mjFgrQRYhY2IozRSiDjFD_7hyKhauy9Cb6Ei2OgZk-L8GH-TjGOuemfaeu2dvqRxLIFnIEu-tixoXkbhNjJO7_qMK_5ZZB8Cf9zoG7GvrAfx_n_IgOKwcG87fQZ6NnS85jedkcDHWrzpklAUfR3o"/>
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="px-2 py-1 bg-primary/20 text-primary text-[10px] font-headline uppercase">Node_Density: High</div>
              <div className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-[10px] font-headline uppercase">Cluster: Beta_9</div>
            </div>
          </div>
        </div>
        
        {/* Feature 2: Conflict Detection */}
        <div className="md:col-span-4 bg-surface-container-high p-8 space-y-6 border-t border-secondary/20">
          <span className="material-symbols-outlined text-secondary text-4xl ">warning</span>
          <h3 className="text-2xl font-headline font-bold uppercase text-secondary">Conflict Detection</h3>
          <p className="text-on-surface-variant text-sm">
            Automated flagging of narrative discrepancies. If two sources disagree on a timestamp or location, the engine highlights the anomaly for manual forensic review.
          </p>
          <div className="space-y-3 pt-4">
            <div className="flex items-center gap-3 p-3 bg-secondary-container/20 border-l-2 border-secondary">
              <span className="text-[10px] font-headline text-secondary uppercase font-bold">Conflict Alpha</span>
              <div className="h-1 flex-1 bg-secondary/10">
                <div className="h-full bg-secondary w-2/3"></div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary-container/20 border-l-2 border-secondary">
              <span className="text-[10px] font-headline text-secondary uppercase font-bold">Temporal Gap</span>
              <div className="h-1 flex-1 bg-secondary/10">
                <div className="h-full bg-secondary w-full"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Feature 3: AI Questioning */}
        <div className="md:col-span-4 bg-surface-container-low p-8 space-y-6 border-t border-tertiary/20">
          <span className="material-symbols-outlined text-tertiary text-4xl ">psychology</span>
          <h3 className="text-2xl font-headline font-bold uppercase text-tertiary">Adversarial AI Questioning</h3>
          <p className="text-on-surface-variant text-sm">
            Our AI doesn't just listen—it probes. It generates investigative questions to fill narrative voids and challenge weak evidentiary links.
          </p>
          <div className="p-4 bg-surface-container-lowest border border-tertiary/10 font-mono text-[10px] text-tertiary/80">
            &gt; GEN_QUERY: Identify actor motivations in Case #812<br/>
            &gt; ANALYZING_GAP: Temporal window 02:00-04:00 unaccounted...<br/>
            &gt; SUGGEST_PROBE: "Where was the cellular signal initiated?"
          </div>
        </div>
        
        {/* Feature 4: Dossier Export */}
        <div className="md:col-span-8 bg-surface p-8 border border-outline-variant/30 flex items-center gap-8 group">
          <div className="flex-1 space-y-4">
            <h3 className="text-2xl font-headline font-bold uppercase">Evidence-Grade Reporting</h3>
            <p className="text-on-surface-variant">
              Generate high-fidelity investigative reports suitable for courtroom or board-level presentation. Includes full provenance tracking for every merged narrative element.
            </p>
            <button className="text-primary font-headline text-xs tracking-widest uppercase flex items-center gap-2 group-hover:gap-4 transition-all pr-0 pl-0 border-none bg-transparent cursor-pointer">
              View Sample Report <span className="material-symbols-outlined ">arrow_right_alt</span>
            </button>
          </div>
          <div className="hidden lg:block w-1/3 aspect-video overflow-hidden border border-outline-variant/20">
            <img className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" alt="Technical document" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGRcW8ZZd3bVoMifx81rTAA9f76PB91Iq06fcnes5Uc87f7VTEIC_m_6X1LcaVP_Z0HaJTu8AdHLkCCZ2g7auIWhEO5bzLgk7MA8oYuNUFlw9P3bVBU9Dpz4FpbPbRekTVPTsOdLwoTWC37jl4sDnJXj-9tAoyrKYcaqjlpuWjOjTElkTWO8iDTDOnCa8IK_H1isywftQL72FhLCsrycvvsiWBlk7l6Dv96Wo9igWm4_6bNlxvlAztG3MTtEoG6LMEZXbGMrB9E1g"/>
          </div>
        </div>
        
      </div>
    </section>
  );
};
