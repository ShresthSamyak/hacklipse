import React from 'react';
import { AuthBrandingSide } from '@/widgets/auth/AuthBrandingSide';
import { AuthFormSide } from '@/widgets/auth/AuthFormSide';

const AuthPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">
      {/* Background gradients simulating the radial backdrops */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(165, 231, 255, 0.03) 0%, transparent 40%),
                            radial-gradient(circle at 80% 70%, rgba(255, 179, 172, 0.02) 0%, transparent 40%)`
        }}
      ></div>

      {/* CSS Noise Overlay SVG */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-[999]" 
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }}
      ></div>

      <main className="w-full max-w-4xl grid md:grid-cols-2 bg-surface-container-lowest relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-outline-variant/20">
        <AuthBrandingSide />
        <AuthFormSide />
      </main>

      {/* HUD Edge Metadata */}
      <div className="fixed top-8 left-8 hidden lg:block opacity-40 z-0 pointer-events-none">
        <div className="flex flex-col gap-1">
          <div className="font-label text-[10px] text-primary uppercase tracking-[0.3em]">Lat: 40.7128° N</div>
          <div className="font-label text-[10px] text-primary uppercase tracking-[0.3em]">Lon: 74.0060° W</div>
          <div className="font-label text-[10px] text-primary uppercase tracking-[0.3em]">Enc: AES-256-GCM</div>
        </div>
      </div>
      
      <div className="fixed bottom-8 right-8 hidden lg:block opacity-40 z-0 pointer-events-none">
        <div className="font-label text-[10px] text-primary uppercase tracking-[0.3em] text-right">
          Narrative Merge Engine <br />
          Build: forensics_v1.0.88
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
