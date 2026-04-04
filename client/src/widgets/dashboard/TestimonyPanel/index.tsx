import React from 'react';

export const TestimonyPanel: React.FC = () => {
  return (
    <section className="col-span-3 bg-surface-container-low flex flex-col p-4 border-r border-outline-variant/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-primary">Testimony Streams</h3>
        <span className="material-symbols-outlined text-xs text-primary">fiber_manual_record</span>
      </div>
      <div className="space-y-4 overflow-y-auto flex-grow pr-2 custom-scrollbar">
        {/* Witness A */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-on-primary text-[10px] px-2 font-black uppercase">Witness A</span>
            <span className="font-label text-[10px] text-gray-500">14:22:04</span>
          </div>
          <div className="bg-surface-container-highest p-3 text-sm font-body leading-relaxed">
            "The vehicle was definitely blue. It stopped near the intersection for about 30 seconds before accelerating rapidly toward the bridge."
          </div>
        </div>
        {/* Witness B */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-secondary text-on-secondary text-[10px] px-2 font-black uppercase">Witness B</span>
            <span className="font-label text-[10px] text-gray-500">14:23:15</span>
          </div>
          <div className="bg-surface-container-highest p-3 text-sm font-body leading-relaxed">
            "I saw a dark grey sedan. It didn't stop, it just slowed down slightly and then turned left before the bridge."
          </div>
          <div className="bg-secondary-container/20 p-2 flex items-center gap-2 border-l-2 border-secondary">
            <span className="material-symbols-outlined text-secondary text-sm">warning</span>
            <span className="font-label text-[10px] text-secondary uppercase font-bold">Conflict Detected: Color & Action</span>
          </div>
        </div>
      </div>
      {/* Input Area */}
      <div className="mt-4 pt-4 border-t border-outline-variant/20">
        <div className="relative">
          <textarea className="w-full bg-surface-container-lowest border-b border-outline-variant text-sm p-3 focus:outline-none focus:border-primary transition-all resize-none min-h-[100px] font-body" placeholder="Log manual testimony or cross-examine..."></textarea>
          <button className="absolute bottom-3 right-3 bg-primary text-on-primary p-2 flex items-center justify-center hover:brightness-110 active:scale-95 transition-all">
            <span className="material-symbols-outlined">mic</span>
          </button>
        </div>
      </div>
    </section>
  );
};
