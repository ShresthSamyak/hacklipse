import React from 'react';

export const EvidenceTable: React.FC = () => {
  return (
    <div className="col-span-12 lg:col-span-12 bg-surface-container-high overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-container-highest">
          <tr>
            <th className="p-4 text-[10px] font-label uppercase text-gray-400">Timestamp</th>
            <th className="p-4 text-[10px] font-label uppercase text-gray-400">Type</th>
            <th className="p-4 text-[10px] font-label uppercase text-gray-400">Evidence Link</th>
            <th className="p-4 text-[10px] font-label uppercase text-gray-400 text-right">Conflict Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/20 font-body text-xs">
          <tr className="hover:bg-white/5 transition-colors">
            <td className="p-4 font-mono text-primary">22:41:03.04</td>
            <td className="p-4 uppercase">Bio-Metric Scan</td>
            <td className="p-4 text-gray-400">log_entry_a552.txt</td>
            <td className="p-4 text-right">
              <span className="bg-secondary/10 text-secondary px-2 py-0.5 border border-secondary/30 uppercase text-[9px] font-bold">Unresolved</span>
            </td>
          </tr>
          <tr className="hover:bg-white/5 transition-colors">
            <td className="p-4 font-mono text-primary">22:41:05.12</td>
            <td className="p-4 uppercase">Visual Optic</td>
            <td className="p-4 text-gray-400">cam_feed_09_main.mp4</td>
            <td className="p-4 text-right">
              <span className="bg-primary/10 text-primary px-2 py-0.5 border border-primary/30 uppercase text-[9px] font-bold">Verified</span>
            </td>
          </tr>
          <tr className="hover:bg-white/5 transition-colors">
            <td className="p-4 font-mono text-primary">22:41:18.99</td>
            <td className="p-4 uppercase">Logic Probe</td>
            <td className="p-4 text-gray-400">core_logic_dump.json</td>
            <td className="p-4 text-right">
              <span className="bg-tertiary/10 text-tertiary px-2 py-0.5 border border-tertiary/30 uppercase text-[9px] font-bold">In-Progress</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
