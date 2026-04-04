import React from 'react';
import { VisualOpticsPanel } from '@/widgets/settings/VisualOpticsPanel';
import { IdentityLockPanel } from '@/widgets/settings/IdentityLockPanel';
import { AudioForensicsPanel } from '@/widgets/settings/AudioForensicsPanel';
import { NeuralModelPanel } from '@/widgets/settings/NeuralModelPanel';

const SettingsPage: React.FC = () => {
  return (
    <main className="pt-16 p-8 min-h-screen relative overflow-hidden bg-background">
      {/* Noise overlay generic */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999]" 
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }}
      ></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-12">
          <h1 className="text-5xl font-headline font-bold text-on-surface tracking-tighter uppercase mb-2">System Configuration</h1>
          <p className="text-on-surface-variant max-w-2xl font-body">Adjust core intelligence parameters, visual optics, and neural model selection for forensic analysis.</p>
        </header>

        <div className="grid grid-cols-12 gap-6 pb-24">
          <VisualOpticsPanel />
          <IdentityLockPanel />
          <AudioForensicsPanel />
          <NeuralModelPanel />
          
          {/* Global Actions */}
          <footer className="col-span-12 flex justify-end gap-4 mt-8">
            <button className="px-8 py-3 text-xs font-headline font-bold uppercase border border-outline-variant hover:bg-surface-container-low hover:text-white transition-all text-gray-400 tracking-widest">
              Revert to Factory
            </button>
            <button className="px-10 py-3 text-xs font-headline font-bold uppercase bg-primary text-black hover:brightness-110 active:scale-95 transition-all tracking-widest">
              Commit Configuration
            </button>
          </footer>
        </div>
      </div>

      {/* Background Layer for Depth */}
      <div className="fixed bottom-0 right-0 p-12 pointer-events-none opacity-[0.05] z-0">
        <span className="text-9xl font-headline font-black text-white tracking-tighter mix-blend-overlay">SETTINGS_X09</span>
      </div>
    </main>
  );
};

export default SettingsPage;
