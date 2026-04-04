import Badge from '../ui/Badge'

/**
 * ConflictAnalysis — renders Git-style merge conflict blocks from the pipeline.
 *
 * Props:
 *   conflicts?: object  (the `conflicts` field from PipelineResponse)
 *   loading?: boolean
 *
 * The backend returns conflicts in two possible shapes:
 *   1. ConflictDetectionResult  { conflicts: [{ conflict_block, type, impact }], ... }
 *   2. { has_conflicts, conflicts: [...], next_question, ... }
 */
import { useState } from 'react'

export default function ConflictAnalysis({ conflicts, conflictsData, loading }) {
  const [expanded, setExpanded] = useState(null)

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="border border-amber-200 rounded-xl p-5 bg-amber-50/50 animate-pulse">
            <div className="h-4 bg-amber-100 rounded w-2/3 mb-2" />
            <div className="h-3 bg-amber-50 rounded w-full" />
          </div>
        ))}
      </div>
    )
  }

  // Use the explicitly provided conflicts array (`result?.conflicts?.conflicts || []`)
  const rawConflicts = conflictsData || []

  if (!conflicts || rawConflicts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <i className="fas fa-triangle-exclamation text-3xl mb-3 block opacity-40" aria-hidden="true" />
        <p className="text-sm">
          {conflicts?.has_conflicts === false
            ? 'No conflicts detected — testimonies are consistent.'
            : 'Run the pipeline to see conflict analysis.'}
        </p>
      </div>
    )
  }

  const impactToPriority = (impact) => {
    if (!impact) return 'low'
    if (impact === 'high') return 'low'      // red badge
    if (impact === 'medium') return 'medium' // amber
    return 'medium'
  }

  const impactDot = (impact) => {
    if (impact === 'high') return 'bg-red-500'
    if (impact === 'medium') return 'bg-amber-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
      {rawConflicts.map((conflict, idx) => {
        const isOpen = expanded === idx
        const block  = conflict.conflict_block ?? ''
        // Extract the two sides of the conflict block (<<< ... === ... >>>)
        const parts  = block.split('=======')
        const sideA  = parts[0]?.replace(/^.*<<<<<<< /m, '').trim() ?? ''
        const sideB  = parts[1]?.replace(/>>>>>>> .*/m, '').trim() ?? ''

        return (
          <div
            key={idx}
            className="border border-amber-200 rounded-xl p-5 bg-amber-50/50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full shrink-0 ${impactDot(conflict.impact)}`} aria-hidden="true" />
                <h4 className="font-semibold text-gray-800 capitalize">
                  {conflict.type ?? 'Conflict'} Discrepancy
                </h4>
              </div>
              <Badge priority={impactToPriority(conflict.impact)}>
                {conflict.impact ? `${conflict.impact} impact` : 'conflict'}
              </Badge>
            </div>

            {/* Git-style conflict block preview */}
            {block && (
              <div>
                <button
                  onClick={() => setExpanded(isOpen ? null : idx)}
                  className="text-xs text-[#9AB17A] hover:underline mb-2 flex items-center gap-1"
                  aria-expanded={isOpen}
                >
                  <i className={`fas fa-code-branch text-xs`} aria-hidden="true" />
                  {isOpen ? 'Hide' : 'Show'} conflict block
                </button>

                {isOpen && (
                  <pre className="text-xs bg-gray-900 text-gray-100 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-5 mb-2">
                    <span className="text-red-400">{parts[0]?.trim()}</span>
                    {'\n=======\n'}
                    <span className="text-green-400">{parts[1]?.trim()}</span>
                  </pre>
                )}

                {!isOpen && sideA && (
                  <p className="text-sm text-gray-600 line-clamp-2">{sideA}</p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Next best question from conflict detection */}
      {conflicts?.next_question && (
        <div className="border border-[rgba(154,177,122,0.4)] rounded-xl p-4 bg-[rgba(154,177,122,0.05)] mt-2">
          <p className="text-xs font-semibold text-[#9AB17A] mb-1">
            <i className="fas fa-circle-question mr-1" aria-hidden="true" />
            Suggested Next Question
          </p>
          <p className="text-sm text-gray-700 italic">
            "{conflicts.next_question.question}"
          </p>
          {conflicts.next_question.reason && (
            <p className="text-xs text-gray-500 mt-1">{conflicts.next_question.reason}</p>
          )}
        </div>
      )}
    </div>
  )
}
