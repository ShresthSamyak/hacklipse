import React from 'react';

export const SystemLogs: React.FC = () => {
  return (
    <div className="mt-16 bg-surface-container-lowest p-6 border-l-4 border-primary">
      <div className="flex items-center gap-4 mb-4">
        <span className="material-symbols-outlined text-primary text-sm" data-icon="terminal">terminal</span>
        <span className="font-label text-[10px] uppercase tracking-[0.4em] text-gray-500">Real-time Investigative Logs</span>
      </div>
      <div className="space-y-2 font-mono text-[11px] text-gray-500">
        <p><span className="text-primary-fixed-dim">[14:22:01]</span> <span className="text-on-surface">SYSTEM_LOG:</span> Analysis engine started for #772-OMEGA...</p>
        <p><span className="text-primary-fixed-dim">[14:23:44]</span> <span className="text-secondary">CONFLICT_DETECTED:</span> Discrepancy found in branch "Alibi_Ref_32"</p>
        <p><span className="text-primary-fixed-dim">[14:25:12]</span> <span className="text-on-surface">SYSTEM_LOG:</span> Merge proposal generated for #441-THETA</p>
        <div className="flex gap-1 animate-pulse">
          <span className="w-2 h-4 bg-primary"></span>
        </div>
      </div>
    </div>
  );
};
