import React from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthFormSide: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/dashboard'); // Mock login routing
  };

  return (
    <div className="bg-surface-variant/60 backdrop-blur-xl border border-primary/5 p-10 md:p-16 flex flex-col justify-center relative">
      <div className="md:hidden flex items-center gap-2 mb-12">
        <span className="material-symbols-outlined text-primary" data-icon="dna">genetics</span>
        <h1 className="font-headline font-bold text-lg tracking-tighter text-primary uppercase">Narrative Merge Engine</h1>
      </div>
      
      <header className="mb-10">
        <div className="inline-block px-2 py-1 bg-primary/10 text-primary font-label text-[10px] tracking-[0.2em] uppercase mb-4">
          Security Protocol v4.02
        </div>
        <h2 className="font-headline text-4xl font-bold tracking-tight text-on-surface mb-2">Access Portal</h2>
        <p className="text-on-surface-variant font-body text-sm">Provide credentials to initialize neural linking.</p>
      </header>
      
      <form className="space-y-8" onSubmit={handleLogin}>
        <div className="group">
          <label className="block font-label text-[10px] tracking-widest text-outline uppercase mb-2 group-focus-within:text-primary transition-colors" htmlFor="email">
            Dossier ID / Email
          </label>
          <input 
            className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 focus:ring-0 focus:border-primary text-on-surface font-body placeholder:text-outline/30 transition-all text-sm outline-none" 
            id="email" 
            placeholder="investigator@agency.forensics" 
            type="email" 
            required 
          />
        </div>
        
        <div className="group">
          <div className="flex justify-between items-center mb-2">
            <label className="block font-label text-[10px] tracking-widest text-outline uppercase group-focus-within:text-primary transition-colors" htmlFor="password">
              Access Cipher
            </label>
            <a className="font-label text-[10px] tracking-widest text-primary/60 hover:text-primary uppercase transition-colors" href="#">
              Recovery
            </a>
          </div>
          <div className="relative">
            <input 
              className="w-full bg-transparent border-0 border-b border-outline-variant py-3 px-0 focus:ring-0 focus:border-primary text-on-surface font-body placeholder:text-outline/30 transition-all text-sm outline-none" 
              id="password" 
              placeholder="••••••••••••" 
              type="password" 
              required 
            />
            <button className="absolute right-0 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors" type="button">
              <span className="material-symbols-outlined text-lg" data-icon="visibility">visibility</span>
            </button>
          </div>
        </div>
        
        <div className="pt-6">
          <button type="submit" className="w-full bg-primary text-on-primary font-headline font-bold uppercase tracking-widest py-5 text-sm active:scale-95 transition-all hover:shadow-[0_0_20px_rgba(165,231,255,0.15)] flex items-center justify-center gap-3">
            <span>Authenticate</span>
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </form>
      
      <footer className="mt-12 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-outline-variant/30"></div>
          <span className="font-label text-[10px] text-outline uppercase tracking-[0.2em]">External Auth</span>
          <div className="h-px flex-1 bg-outline-variant/30"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button className="border border-outline-variant/30 py-3 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors text-on-surface font-label text-[10px] tracking-widest uppercase">
            <span className="material-symbols-outlined text-base">fingerprint</span>
            Biometrics
          </button>
          <button className="border border-outline-variant/30 py-3 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors text-on-surface font-label text-[10px] tracking-widest uppercase">
            <span className="material-symbols-outlined text-base">key</span>
            SSO Token
          </button>
        </div>
        <p className="text-center font-body text-xs text-on-surface-variant">
          Unauthorized access is logged and prosecuted. <br />
          <a className="text-primary hover:underline underline-offset-4" href="#">Request Clearance</a>
        </p>
      </footer>
    </div>
  );
};
