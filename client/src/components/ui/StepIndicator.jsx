/**
 * StepIndicator — shows progress through a multi-step form
 * Props:
 *   totalSteps: number
 *   currentStep: number (1-indexed)
 */
export default function StepIndicator({ totalSteps, currentStep }) {
  return (
    <div className="flex items-center gap-3" role="list" aria-label="Form progress">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1
        const isActive = step === currentStep
        const isCompleted = step < currentStep

        return (
          <div
            key={step}
            role="listitem"
            aria-current={isActive ? 'step' : undefined}
            aria-label={`Step ${step}${isCompleted ? ' (completed)' : isActive ? ' (current)' : ''}`}
            className={[
              'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300',
              isActive
                ? 'bg-[#9AB17A] text-white shadow-[0_4px_12px_rgba(154,177,122,0.4)]'
                : isCompleted
                  ? 'bg-[#C3CC9B] text-white'
                  : 'bg-[#E4DFB5] text-[#2d3a2d]',
            ].join(' ')}
          >
            {isCompleted ? <i className="fas fa-check text-xs" aria-hidden="true" /> : step}
          </div>
        )
      })}
    </div>
  )
}
