import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const getMenuItemClass = (path: string) => {
    const isActive = currentPath === path;
    const baseClass = "flex items-center gap-3 p-4 w-full cursor-pointer no-underline transition-colors ";
    return baseClass + (isActive ? "bg-[#a5e7ff] text-[#003543]" : "text-gray-400 hover:bg-white/5");
  };

  const getIconStyle = (path: string) => {
    return currentPath === path ? { fontVariationSettings: "'FILL' 1" } : {};
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-16 h-[calc(100vh-64px)] z-40 flex-col pt-4 bg-[#201f20] w-16 hover:w-64 group transition-all duration-300 border-none overflow-hidden">
      <div className="px-4 py-2 mb-4">
        <div className="text-[#a5e7ff] font-black uppercase text-xs group-hover:block hidden">Dossier</div>
        <div className="text-[#a5e7ff] font-black uppercase text-xs group-hover:hidden block">D</div>
      </div>
      <nav className="flex flex-col gap-1 w-full font-['Space_Grotesk'] text-xs font-medium uppercase">
        <Link to="/dashboard" className={getMenuItemClass('/dashboard')}>
          <span className="material-symbols-outlined shrink-0" style={getIconStyle('/dashboard')}>dashboard</span>
          <span className="group-hover:block hidden whitespace-nowrap">Dashboard</span>
        </Link>
        <Link to="/cases" className={getMenuItemClass('/cases')}>
          <span className="material-symbols-outlined shrink-0" style={getIconStyle('/cases')}>folder_open</span>
          <span className="group-hover:block hidden whitespace-nowrap">Cases</span>
        </Link>
        <Link to="/branch-view" className={getMenuItemClass('/branch-view')}>
          <span className="material-symbols-outlined shrink-0" style={getIconStyle('/branch-view')}>account_tree</span>
          <span className="group-hover:block hidden whitespace-nowrap">Branch View</span>
        </Link>
        <Link to="/conflict-explorer" className={getMenuItemClass('/conflict-explorer')}>
          <span className="material-symbols-outlined shrink-0" style={getIconStyle('/conflict-explorer')}>warning</span>
          <span className="group-hover:block hidden whitespace-nowrap">Conflict Explorer</span>
        </Link>
        <Link to="/settings" className={getMenuItemClass('/settings')}>
          <span className="material-symbols-outlined shrink-0" style={getIconStyle('/settings')}>settings</span>
          <span className="group-hover:block hidden whitespace-nowrap">Settings</span>
        </Link>
      </nav>
    </aside>
  );
};
