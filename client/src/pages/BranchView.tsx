import React from 'react';
import { BranchHeader } from '@/widgets/branch/BranchHeader';
import { WitnessComparison } from '@/widgets/branch/WitnessComparison';
import { TimelineNavigation } from '@/widgets/branch/TimelineNavigation';
import { AIActionSidebar } from '@/widgets/branch/AIActionSidebar';

const BranchViewPage: React.FC = () => {
  return (
    <main className="pt-16 pr-80 p-8 h-screen bg-background flex flex-col gap-6 relative overflow-hidden">
      {/* Noise filter generic setup */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999]" 
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }}
      ></div>

      <BranchHeader />
      <WitnessComparison />
      <TimelineNavigation />
      <AIActionSidebar />

      {/* Floating Background Element (Map/Grid) */}
      <div className="absolute top-0 right-80 w-[600px] h-[600px] opacity-[0.02] pointer-events-none overflow-hidden">
        <div className="w-[150%] h-[150%] -top-[25%] -left-[25%] absolute rotate-45"
             style={{ background: 'repeating-linear-gradient(90deg, #3c494e 0, #3c494e 10px, transparent 10px, transparent 20px)' }}>
        </div>
      </div>
    </main>
  );
};

export default BranchViewPage;
