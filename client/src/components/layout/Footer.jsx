import { Link } from 'react-router-dom'

const footerLinks = [
  { to: '/', label: 'Home' },
  { to: '/investigator', label: 'Investigator' },
  { to: '/survivor', label: 'Survivor' },
  { to: '/graph', label: 'Graph' },
]

export default function Footer() {
  return (
    <footer className="bg-[#1e293b] border-t border-[#334155] py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-mono-code font-semibold text-[#94a3b8]">ChronoMerge</span>
        </div>

        <nav aria-label="Footer navigation">
          <div className="flex space-x-6 text-sm text-[#94a3b8]">
            {footerLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="hover:text-[#f8fafc] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <p className="text-sm text-[#94a3b8]">
          &copy; 2025 ChronoMerge Engine. All realities reserved.
        </p>
      </div>
    </footer>
  )
}
