import React from 'react';

export const ProcessSteps: React.FC = () => {
  return (
    <section className="py-24 bg-surface-container-lowest relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-outline-variant/20">
          
          {/* Step 1 */}
          <div className="p-12 space-y-6 hover:bg-surface-container-low transition-colors group">
            <div className="text-primary font-headline text-sm tracking-tighter opacity-50">PHASE_01</div>
            <div className="w-12 h-12 flex items-center justify-center bg-surface-container-high text-primary border border-outline-variant/30">
              <span className="material-symbols-outlined">input</span>
            </div>
            <h3 className="text-2xl font-headline font-bold text-on-surface uppercase">Input</h3>
            <p className="text-on-surface-variant font-body text-sm leading-relaxed">
              Ingest raw data streams, witness transcripts, and digital footprints. Our engine serializes chaotic information into a forensic-ready format.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-12 space-y-6 bg-surface-container-low border-x md:border-x-0 md:border-l border-outline-variant/20 hover:bg-surface-container transition-colors group">
            <div className="text-primary font-headline text-sm tracking-tighter opacity-50">PHASE_02</div>
            <div className="w-12 h-12 flex items-center justify-center bg-primary text-black border border-primary">
              <span className="material-symbols-outlined">merge</span>
            </div>
            <h3 className="text-2xl font-headline font-bold text-on-surface uppercase">Merge</h3>
            <p className="text-on-surface-variant font-body text-sm leading-relaxed">
              AI cross-references data nodes. It maps temporal alignments and narrative overlaps to create a multi-dimensional graph of reality.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-12 space-y-6 hover:bg-surface-container-low transition-colors group">
            <div className="text-primary font-headline text-sm tracking-tighter opacity-50">PHASE_03</div>
            <div className="w-12 h-12 flex items-center justify-center bg-surface-container-high text-primary border border-outline-variant/30">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
            <h3 className="text-2xl font-headline font-bold text-on-surface uppercase">Resolve</h3>
            <p className="text-on-surface-variant font-body text-sm leading-relaxed">
              Identify the most probable truth. Resolve conflicts through evidentiary weighting and eliminate tactical narrative distortions.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
