import React from 'react';
import { useInvestigationStore } from '@/app/store/investigationStore';

export const GraphPanel: React.FC = () => {
  const { pipelineData, isLoading } = useInvestigationStore();
  const nextQuestion = pipelineData?.next_question;
  const probableLength = pipelineData?.timeline?.probable_sequence?.length || 0;
  const conflictCount = pipelineData?.conflicts?.conflicts?.length || 0;

  return (
    <section className="col-span-6 bg-surface-container-lowest relative flex items-center justify-center overflow-hidden">
      {/* Background Map/Tech Grid */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none grayscale" 
        style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBeJdCOeGjJRVGmq5SoUhF48CbUvp4aBnm88K0az3hhzoV8l6NHvzRsFZb3Ny32qr8zvL0vQa-S-auBwGv-1Zc-MIAaEKmdiHqj0ZBDOvo4uzHqhnJuDagqN0OLZtYvbK_y8a5e_m1fSlBP7tjT_WJgzX0iy_mXF2KKNDvBsjvyeFSUJsKWbTse3MMd83maf3ZxyEwT8MQSZXCQMkgoCK1RB2adpwL1frzUPgowD8ZVM3qXoVJcNZuMAWK9cwgYZ_wJxJrhotkX1nM')", backgroundSize: 'cover', mixBlendMode: 'overlay' }}
      ></div>
      
      {/* Graph Controls */}
      <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
        <button className="bg-surface-container-highest p-2 text-primary hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center border border-outline-variant/10">
          <span className="material-symbols-outlined">add</span>
        </button>
        <button className="bg-surface-container-highest p-2 text-primary hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center border border-outline-variant/10">
          <span className="material-symbols-outlined">remove</span>
        </button>
        <button className="bg-surface-container-highest p-2 text-primary hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center border border-outline-variant/10">
          <span className="material-symbols-outlined">center_focus_weak</span>
        </button>
      </div>

      {/* Visual Nodes */}
      <div className={`relative w-full h-full flex items-center justify-center transition-all duration-1000 ${isLoading ? 'blur-sm grayscale opacity-30 scale-95' : 'blur-0 opacity-100 scale-100'}`}>
        {/* Central Node */}
        <div className="relative z-20 hover:scale-105 transition-transform cursor-pointer">
          <div className="w-40 h-40 border-2 border-primary/20 flex flex-col items-center justify-center bg-surface-container/60 backdrop-blur-xl rounded-full glow-sm">
            <span className="font-label text-[10px] text-primary uppercase tracking-widest font-black">Timeline Basis</span>
            <span className="font-headline text-4xl font-bold text-white">{probableLength}</span>
            <span className="font-label text-[10px] text-gray-500 uppercase">Probable Events</span>
          </div>
          {/* Pulsing Ring */}
          {!isLoading && <div className="absolute inset-0 border-2 border-primary rounded-full animate-ping opacity-20"></div>}
        </div>

        {/* Conflict Cluster */}
        {conflictCount > 0 && (
          <div className="absolute top-1/4 right-1/4 z-20 animate-in zoom-in duration-700">
            <div className="w-28 h-28 border-2 border-secondary/40 bg-secondary-container/10 flex flex-col items-center justify-center backdrop-blur-md rounded-lg shadow-2xl">
              <span className="font-label text-[10px] text-secondary uppercase font-black">Divergence</span>
              <span className="font-headline text-2xl text-white font-black">{conflictCount}</span>
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            </div>
          </div>
        )}

        {/* Verified Basis */}
        <div className="absolute bottom-1/4 left-1/4 z-20 animate-in zoom-in duration-1000">
          <div className="w-24 h-24 border-2 border-tertiary/40 bg-tertiary-container/10 flex flex-col items-center justify-center backdrop-blur-md rotate-3">
            <span className="font-label text-[10px] text-tertiary uppercase font-black">Consensus</span>
            <span className="font-headline text-xl text-white font-bold">{pipelineData?.conflicts?.confirmed_events?.length || 0}</span>
            <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
        </div>
      </div>

      {/* AI Intelligence Footer */}
      {nextQuestion && !isLoading && (
        <div className="absolute bottom-0 w-full p-6 animate-in slide-in-from-bottom-8 duration-700">
          <div className="bg-surface-container/80 border-t border-primary/30 p-5 flex items-center justify-between shadow-2xl backdrop-blur-2xl">
            <div className="flex items-center gap-6">
              <div className="bg-primary text-on-primary w-12 h-12 flex items-center justify-center rounded-sm">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-headline text-xs font-black uppercase text-primary tracking-widest">Intelligent Probe Suggestion</h4>
                  <span className="bg-primary/20 text-primary text-[8px] px-1 font-bold">Priority: {nextQuestion.priority}</span>
                </div>
                <p className="font-body text-base text-on-surface leading-tight font-medium max-w-2xl">"{nextQuestion.question}"</p>
                <p className="text-[10px] text-gray-500 font-label italic mt-1 leading-none">{nextQuestion.why_this_question}</p>
              </div>
            </div>
            <button className="font-label text-xs uppercase font-black text-black bg-primary px-6 py-3 hover:brightness-110 active:scale-[0.98] transition-all shadow-lg flex items-center gap-2">
               Execute Probe
               <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
