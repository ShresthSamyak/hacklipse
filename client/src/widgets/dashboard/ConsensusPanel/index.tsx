import React from 'react';
import { useInvestigationStore } from '@/app/store/investigationStore';
import { DetectedConflict, MergedEvent } from '@/shared/api/types';

export const ConsensusPanel: React.FC = () => {
  const { pipelineData, isLoading } = useInvestigationStore();
  const conflictsData = pipelineData?.conflicts;

  const resolvedCount = conflictsData?.confirmed_events?.length || 0;
  const conflictCount = conflictsData?.conflicts?.length || 0;

  return (
    <section className="col-span-3 bg-surface-container-low flex flex-col p-4 border-l border-outline-variant/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-primary">Consensus Registry</h3>
        <span className="font-label text-[10px] text-gray-500">{conflictCount} Conflicts / {resolvedCount} Verified</span>
      </div>
      <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
        
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <span className="material-symbols-outlined animate-spin text-2xl mb-2">sync_problem</span>
            <p className="text-[10px] font-label uppercase text-center">Detecting Narrative Collisions...</p>
          </div>
        )}

        {/* Render Conflicts */}
        {!isLoading && conflictsData?.conflicts?.map((conflict: DetectedConflict, i: number) => (
          <div key={conflict.id || i} className="group space-y-2 p-3 bg-secondary-container/5 border border-secondary/20 hover:border-secondary/40 transition-all animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${i * 150}ms` }}>
            <div className="flex items-center justify-between">
              <span className="font-label text-[9px] text-secondary uppercase font-black tracking-widest">{conflict.category} Mismatch</span>
              <div className="flex items-center gap-1">
                 <div className="h-1 w-12 bg-surface-variant overflow-hidden">
                    <div className="h-full bg-secondary" style={{ width: `${(conflict.impact?.impact_score || 0.5) * 100}%` }}></div>
                 </div>
                 <span className="font-label text-[8px] text-secondary font-bold">IMP: {Math.round((conflict.impact?.impact_score || 0.5) * 100)}%</span>
              </div>
            </div>
            <p className="text-xs font-body text-on-surface-variant leading-none mb-2 font-bold">{conflict.description}</p>
            <div className="flex flex-col gap-1">
              <div className="bg-secondary-container/10 border-l-2 border-secondary p-2 text-[10px] font-body flex justify-between items-start">
                <span className="text-secondary opacity-90 whitespace-pre-line leading-tight">
                    {conflict.merge_block?.branch_a_text}
                </span>
                <span className="font-label text-[8px] text-secondary/40 font-black ml-2">{conflict.branch_a || 'A'}</span>
              </div>
              <div className="h-px w-full bg-secondary/10 relative">
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-container-low px-1 text-[8px] text-secondary font-black">X</span>
              </div>
              <div className="bg-secondary-container/10 border-l-2 border-secondary p-2 text-[10px] font-body flex justify-between items-start">
                <span className="text-secondary opacity-90 whitespace-pre-line leading-tight">
                    {conflict.merge_block?.branch_b_text}
                </span>
                <span className="font-label text-[8px] text-secondary/40 font-black ml-2">{conflict.branch_b || 'B'}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Render Confirmed */}
        {!isLoading && conflictsData?.confirmed_events?.map((ev: MergedEvent, i: number) => (
          <div key={`conf-${i}`} className="space-y-1 opacity-60">
            <div className="flex items-center justify-between px-2">
              <span className="font-label text-[8px] text-gray-500 uppercase font-bold tracking-tighter">Verified Alignment</span>
            </div>
            <div className="bg-primary/5 border-l-2 border-primary/40 p-2 text-xs font-body flex items-center justify-between">
              <span className="text-on-surface line-clamp-1">{ev.description}</span>
              <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
          </div>
        ))}

        {!isLoading && !conflictCount && resolvedCount === 0 && (
          <div className="flex flex-col items-center justify-center mt-12 opacity-20 grayscale">
            <span className="material-symbols-outlined text-4xl mb-2">account_tree</span>
            <p className="text-[10px] font-label uppercase text-center px-8 tracking-widest">Awaiting multi-witness synchronization.</p>
          </div>
        )}
      </div>
      {/* Footer Summary */}
      {!isLoading && (
         <div className="mt-auto pt-4 space-y-4">
            <div className="p-3 bg-surface-container-highest flex items-center justify-between">
                <div>
                    <p className="text-[8px] font-label text-gray-400 uppercase">Integrity Score</p>
                    <p className="text-lg font-headline font-black text-primary">
                        {pipelineData ? Math.round((resolvedCount / (conflictCount + resolvedCount || 1)) * 100) : 0}%
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    <p className="text-[8px] font-label text-gray-400 uppercase">Status</p>
                    <div className="flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${conflictCount > 0 ? 'bg-secondary animate-pulse' : 'bg-primary'}`}></div>
                        <p className="text-[10px] font-label uppercase font-black text-on-surface">
                            {conflictCount > 0 ? 'Reconstruction Blocked' : 'Narrative Stable'}
                        </p>
                    </div>
                </div>
            </div>
            <button className="w-full bg-primary text-black font-headline text-xs font-black uppercase py-4 tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">description</span>
            GENERATE CASE REPORT
            </button>
         </div>
      )}
    </section>
  );
};
