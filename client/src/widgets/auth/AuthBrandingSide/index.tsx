import React from 'react';

export const AuthBrandingSide: React.FC = () => {
  return (
    <div className="relative hidden md:flex flex-col justify-between p-12 overflow-hidden bg-surface-dim">
      <div className="absolute top-[-2px] left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-8">
          <span className="material-symbols-outlined text-primary text-3xl" data-icon="dna">genetics</span>
          <h1 className="font-headline font-bold text-xl tracking-tighter text-primary uppercase">Narrative Merge Engine</h1>
        </div>
        <div className="space-y-6">
          <div className="h-px w-12 bg-primary/40"></div>
          <p className="font-headline text-3xl leading-tight font-light tracking-tight text-on-surface">
            UNIFY DISPARATE <br />
            <span className="text-primary font-bold">FORENSIC DATA</span> <br />
            INTO COHERENT <br />
            INTEL.
          </p>
        </div>
      </div>
      
      <div className="relative z-10 mt-auto">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 text-xs font-label tracking-widest text-outline uppercase">
            <span className="text-primary">System Status</span>
            <span className="flex-1 h-[1px] bg-outline-variant/30"></span>
            <span className="text-primary">Online</span>
          </div>
          <div className="grid grid-cols-4 gap-1 h-8">
            <div className="bg-primary/20"></div>
            <div className="bg-primary/40"></div>
            <div className="bg-primary/10"></div>
            <div className="bg-primary/60"></div>
          </div>
        </div>
      </div>
      
      {/* Abstract Background Asset */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(165,231,255,0.1)_0%,transparent_70%)]"></div>
        <img 
          className="w-full h-full object-cover grayscale opacity-30 mix-blend-overlay" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUxRpBWVeDTTZQK9hC-5Lql9yclB3WvfOO6bsWmooZpHtPm9BF-4EX-pv3WkEZIPyhkK7nNf2uTOvhFAKsn67QJEE_sez_85hIR1IF_ombK_91Y58W8GeJ_dZ8BEKoxykHYQ6_QAo-KkmMZABSNQ7BSYE4QMz_md_TSmGoYclvRJ1SzHjNDZJd3na4gvKgLIr5ZWAwCSdcRc3r3FK75sTC4bHXNqLZBNyQN1_FoA9YnO93cw6_TCrExJJN4RzWmLvDGLZoqHf4eCQ" 
          alt="Forensic laboratory data screens" 
        />
      </div>
    </div>
  );
};
