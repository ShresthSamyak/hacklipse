import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-container-lowest border-t border-outline-variant/10 py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-2 space-y-6">
          <div className="text-2xl font-headline font-bold tracking-tighter text-primary uppercase">Narrative Merge Engine</div>
          <p className="text-on-surface-variant font-body text-sm max-w-xs leading-relaxed">
            The world's first AI-forensics platform designed for corporate intelligence, legal discovery, and historical reconstruction.
          </p>
          <div className="flex gap-4">
            <a className="material-symbols-outlined text-gray-500 hover:text-primary transition-colors  no-underline cursor-pointer">terminal</a>
            <a className="material-symbols-outlined text-gray-500 hover:text-primary transition-colors  no-underline cursor-pointer">share</a>
            <a className="material-symbols-outlined text-gray-500 hover:text-primary transition-colors  no-underline cursor-pointer">mail</a>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="text-[10px] font-headline font-bold text-on-surface uppercase tracking-widest">Protocol</h4>
          <ul className="space-y-2 text-sm text-gray-500 font-body m-0 p-0 list-none">
            <li><a className="hover:text-primary transition-colors cursor-pointer">API Documentation</a></li>
            <li><a className="hover:text-primary transition-colors cursor-pointer">Security Layer</a></li>
            <li><a className="hover:text-primary transition-colors cursor-pointer">Data Privacy</a></li>
            <li><a className="hover:text-primary transition-colors cursor-pointer">Terms of Use</a></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="text-[10px] font-headline font-bold text-on-surface uppercase tracking-widest">Division</h4>
          <ul className="space-y-2 text-sm text-gray-500 font-body m-0 p-0 list-none">
            <li><a className="hover:text-primary transition-colors cursor-pointer">Case Management</a></li>
            <li><a className="hover:text-primary transition-colors cursor-pointer">Forensic Units</a></li>
            <li><a className="hover:text-primary transition-colors cursor-pointer">AI Research</a></li>
            <li><a className="hover:text-primary transition-colors cursor-pointer">Contact Center</a></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-outline-variant/5 flex flex-col md:flex-row justify-between gap-4 text-[10px] font-headline text-gray-600 uppercase tracking-widest">
        <div>© 2024 NARRATIVE MERGE ENGINE. ALL RIGHTS RESERVED.</div>
        <div className="flex gap-6">
          <span>SYSTEM_STATUS: NOMINAL</span>
          <span>LATENCY: 12MS</span>
        </div>
      </div>
    </footer>
  );
};
