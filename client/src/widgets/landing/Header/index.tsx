import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#131314] border-none">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold tracking-tighter text-[#a5e7ff] font-headline">Narrative Merge Engine</span>
      </div>
      <nav className="hidden md:flex items-center gap-8 font-['Space_Grotesk'] tracking-tight text-sm uppercase">
        <a className="text-[#a5e7ff] font-bold border-b-2 border-[#a5e7ff] py-1 transition-all duration-75 cursor-pointer no-underline">Case Selector</a>
        <a className="text-gray-500 hover:bg-[#a5e7ff]/10 hover:text-white px-2 py-1 transition-all duration-75 cursor-pointer no-underline">Mode Toggle</a>
      </nav>
      <div className="flex items-center gap-4">
        <button className="material-symbols-outlined  text-[#a5e7ff] p-2 hover:bg-[#a5e7ff]/10 active:scale-95 transition-all bg-transparent border-none cursor-pointer">
          account_circle
        </button>
      </div>
    </header>
  );
};
