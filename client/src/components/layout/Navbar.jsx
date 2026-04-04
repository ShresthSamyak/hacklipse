import { useState } from 'react'
import { NavLink } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/investigator', label: 'Investigator Dashboard' },
  { to: '/survivor', label: 'Survivor Input' },
  { to: '/graph', label: 'Reality Graph' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    isActive
      ? 'bg-[#0f172a] text-[#6366f1] px-3 py-2 rounded-md text-sm font-medium border border-[#334155] font-mono-code'
      : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b] px-3 py-2 rounded-md text-sm font-medium transition-colors font-mono-code'

  const mobileLinkClass = ({ isActive }) =>
    isActive
      ? 'bg-[#0f172a] text-[#6366f1] block px-3 py-2 rounded-md text-base font-medium'
      : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b] block px-3 py-2 rounded-md text-base font-medium'

  return (
    <nav className="bg-[#1e293b] border-b border-[#334155] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2">
            <svg className="w-8 h-8 text-[#6366f1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-mono-code font-bold text-xl tracking-tight text-[#f8fafc]">
              Chrono<span className="text-[#6366f1]">Merge</span>
            </span>
          </NavLink>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#1e293b] border-b border-[#334155]">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={mobileLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
