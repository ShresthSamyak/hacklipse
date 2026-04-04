import React from 'react';
import { TestimonyPanel } from '@/widgets/dashboard/TestimonyPanel';
import { GraphPanel } from '@/widgets/dashboard/GraphPanel';
import { ConsensusPanel } from '@/widgets/dashboard/ConsensusPanel';

const Dashboard: React.FC = () => {
  return (
    <main className="pt-16 h-screen w-full flex flex-col overflow-hidden">
      <div className="flex-grow grid grid-cols-12 gap-0 overflow-y-auto">
        <TestimonyPanel />
        <GraphPanel />
        <ConsensusPanel />
      </div>
    </main>
  );
};

export default Dashboard;
