const legendItems = [
  { color: 'bg-[#6366f1]', label: 'Mainline' },
  { color: 'bg-red-500', label: 'Branch Alpha' },
  { color: 'bg-[#10b981]', label: 'Branch Beta' },
  { color: 'bg-amber-500 border border-white', label: 'Conflict' },
]

export default function GraphLegend() {
  return (
    <div className="flex flex-wrap gap-4 text-sm font-mono-code text-[#f8fafc]" role="list" aria-label="Graph legend">
      {legendItems.map((item) => (
        <div key={item.label} className="flex items-center gap-2" role="listitem">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${item.color}`} aria-hidden="true" />
          {item.label}
        </div>
      ))}
    </div>
  )
}
