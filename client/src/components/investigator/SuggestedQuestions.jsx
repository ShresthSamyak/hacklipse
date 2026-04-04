import Badge from '../ui/Badge'

/**
 * SuggestedQuestions — shows AI-generated investigator questions.
 *
 * Two data sources (in priority order):
 *   1. `questions` prop  — array from /questions/timelines/{id}  (persisted)
 *   2. `conflicts` prop  — pipeline ConflictDetectionResult which contains `next_question`
 *
 * Props:
 *   questions?: Array<{ id, question_text, priority?, target_narrator? }>
 *   conflicts?: object   (pipeline conflicts blob — used as fallback)
 *   loading?: boolean
 */
export default function SuggestedQuestions({ questions, conflicts, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="border border-[rgba(154,177,122,0.3)] rounded-xl p-5 animate-pulse"
          >
            <div className="h-5 bg-green-100 rounded w-20 mb-3" />
            <div className="h-4 bg-gray-100 rounded w-full mb-2" />
            <div className="h-3 bg-gray-50 rounded w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  // ── Build question list from whatever we have ──────────────────────────────

  // 1. Use persisted questions array if provided and non-empty
  if (questions && questions.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.id ?? idx}
            label={`Priority ${idx + 1}`}
            priority={q.priority === 'high' ? 'high' : q.priority === 'medium' ? 'medium' : 'low'}
            question={q.question_text}
            target={q.target_narrator ? `Target: ${q.target_narrator}` : null}
            aim={q.aim ?? null}
          />
        ))}
      </div>
    )
  }

  // 2. Fallback: synthesise from conflict detection result
  const nextQ = conflicts?.next_question
  if (nextQ) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <QuestionCard
          label="AI Suggestion"
          priority="high"
          question={nextQ.question}
          target={null}
          aim={nextQ.reason}
        />
      </div>
    )
  }

  // 3. Empty state
  return (
    <div className="text-center py-8 text-gray-400">
      <i className="fas fa-circle-question text-3xl mb-3 block opacity-40" aria-hidden="true" />
      <p className="text-sm">No questions generated yet. Run the full pipeline to see AI-suggested questions.</p>
    </div>
  )
}

function QuestionCard({ label, priority, question, target, aim }) {
  return (
    <div className="border border-[rgba(154,177,122,0.3)] rounded-xl p-5 bg-gradient-to-br from-[rgba(154,177,122,0.05)] to-[rgba(195,204,155,0.1)]">
      <div className="mb-3">
        <Badge priority={priority === 'high' ? 'high' : priority === 'medium' ? 'medium' : 'low'}>
          {label}
        </Badge>
      </div>
      <p className="text-sm font-medium text-gray-800 mb-2">"{question}"</p>
      {target && <p className="text-xs text-gray-600 mb-3">{target}</p>}
      {aim && (
        <p className="text-xs text-[#9AB17A]">
          <i className="fas fa-bullseye mr-1" aria-hidden="true" />
          {aim}
        </p>
      )}
    </div>
  )
}
