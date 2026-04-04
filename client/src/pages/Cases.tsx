import React from 'react';
import { StatsRow } from '@/widgets/cases/StatsRow';
import { CaseGrid } from '@/widgets/cases/CaseGrid';
import { SystemLogs } from '@/widgets/cases/SystemLogs';

const CasesPage: React.FC = () => {
  return (
    <main className="pt-16 p-8 min-h-screen relative overflow-hidden">
      {/* Carbon fibre global background logic is typically added to index.css or handled explicitly. The parent HTML had specific body bg rules. We will add the overlay locally to avoid bleeding into other routes. */}
      {/* Background radial dots and texture simulating the HTML body bg for cases */}
      <div className="absolute inset-0 z-[-1] opacity-50 bg-[radial-gradient(#201f20_1px,transparent_1px)]" style={{ backgroundSize: '40px 40px' }}></div>
      <div className="absolute inset-0 z-[-1] pointer-events-none opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      
      {/* Header Section */}
      <header className="flex justify-between items-end mb-12">
        <div>
          <h1 className="font-headline text-5xl font-bold tracking-tighter uppercase text-on-surface">Active Investigations</h1>
          <p className="font-label text-sm text-gray-500 mt-2 tracking-widest">SUB-PROCESS: NARRATIVE_SCANNER_v4.2</p>
        </div>
        <button className="bg-primary text-black px-8 py-4 font-headline font-bold uppercase text-xs tracking-widest flicker-animation active:scale-95 transition-all">
          Create new case
        </button>
      </header>

      <StatsRow />
      <CaseGrid />
      <SystemLogs />
    </main>
  );
};

export default CasesPage;
