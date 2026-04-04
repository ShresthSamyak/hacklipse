import Badge from '../ui/Badge'

/**
 * EventTimeline — renders a chronological sequence of events from the pipeline.
 *
 * Props:
 *   events?: Array<{ id, description, time?, time_uncertainty?, confidence?, location?, actors? }>
 *   loading?: boolean
 */
export default function EventTimeline({ events, loading }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="timeline-item animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-full mb-2" />
            <div className="h-5 bg-gray-100 rounded w-24" />
          </div>
        ))}
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <i className="fas fa-timeline text-3xl mb-3 block opacity-40" aria-hidden="true" />
        <p className="text-sm">No events yet. Submit a testimony to populate the timeline.</p>
      </div>
    )
  }

  /**
   * Map backend confidence/placement to a UI priority tier.
   * Backend values: "confirmed" | "probable" | "uncertain" | 0.0–1.0
   */
  const tier = (event) => {
    const c = event.placement_confidence ?? event.confidence
    if (!c) return 'low'
    if (typeof c === 'string') {
      if (c === 'confirmed') return 'high'
      if (c === 'probable')  return 'medium'
      return 'low'
    }
    if (c >= 0.75) return 'high'
    if (c >= 0.45) return 'medium'
    return 'low'
  }

  const tierLabel = (event) => {
    const t = tier(event)
    if (t === 'high') return 'High Confidence'
    if (t === 'medium') return 'Probable'
    return 'Uncertain'
  }

  return (
    <div className="space-y-6 max-h-96 overflow-y-auto pr-1">
      {events.map((event, idx) => (
        <div key={event.id ?? idx} className="timeline-item">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-800 line-clamp-1">
              {event.description}
            </span>
            {event.time && (
              <span className="text-xs font-mono-code text-gray-500 ml-2 shrink-0">
                {event.time}
              </span>
            )}
          </div>

          {event.location && (
            <p className="text-xs text-gray-500 mb-1">
              <i className="fas fa-location-dot mr-1" aria-hidden="true" />
              {event.location}
            </p>
          )}

          {event.actors && event.actors.length > 0 && (
            <p className="text-xs text-gray-500 mb-2">
              <i className="fas fa-user mr-1" aria-hidden="true" />
              {event.actors.join(', ')}
            </p>
          )}

          <Badge priority={tier(event)}>{tierLabel(event)}</Badge>
        </div>
      ))}
    </div>
  )
}
