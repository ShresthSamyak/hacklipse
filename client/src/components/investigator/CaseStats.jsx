/**
 * CaseStats — shows live counts from the pipeline result,
 * or falls back to placeholder values while loading / not yet fetched.
 *
 * Props:
 *   stats?: { testimonies: number, conflicts: number, confidence: number }
 *   loading?: boolean
 */
export default function CaseStats({ stats, loading }) {
  const testimonies = stats?.testimonies ?? '--'
  const conflicts   = stats?.conflicts   ?? '--'
  const confidence  = stats?.confidence  != null ? `${Math.round(stats.confidence * 100)}%` : '--'

  const items = [
    {
      icon: 'fas fa-users',
      label: 'Total Testimonies',
      value: loading ? '…' : testimonies,
      detail: 'Processed through the pipeline',
      colorClass: 'from-[rgba(154,177,122,0.1)] to-[rgba(195,204,155,0.1)] border-[rgba(154,177,122,0.3)]',
      valueColor: 'text-[#9AB17A]',
      iconColor: 'text-[#9AB17A]',
    },
    {
      icon: 'fas fa-triangle-exclamation',
      label: 'Conflicts Detected',
      value: loading ? '…' : conflicts,
      detail: 'Git-style narrative conflicts',
      colorClass: 'from-[rgba(228,223,181,0.5)] to-[rgba(251,232,206,0.3)] border-[#E4DFB5]',
      valueColor: 'text-amber-600',
      iconColor: 'text-amber-600',
    },
    {
      icon: 'fas fa-circle-check',
      label: 'Avg. Confidence',
      value: loading ? '…' : confidence,
      detail: 'Based on event placement scoring',
      colorClass: 'from-[rgba(154,177,122,0.1)] to-[rgba(195,204,155,0.1)] border-[rgba(154,177,122,0.3)]',
      valueColor: 'text-[#9AB17A]',
      iconColor: 'text-[#9AB17A]',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {items.map((stat) => (
        <div
          key={stat.label}
          className={`bg-gradient-to-br ${stat.colorClass} p-6 rounded-xl border transition-all duration-300`}
        >
          <div className="flex items-center gap-3 mb-3">
            <i className={`${stat.icon} ${stat.iconColor} text-xl`} aria-hidden="true" />
            <h3 className="font-semibold text-gray-800">{stat.label}</h3>
          </div>
          <p className={`text-3xl font-bold ${stat.valueColor}`}>{stat.value}</p>
          <p className="text-xs text-gray-600 mt-2">{stat.detail}</p>
        </div>
      ))}
    </div>
  )
}
