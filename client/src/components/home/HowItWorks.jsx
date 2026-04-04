const steps = [
  { number: '1', text: 'Select your role and provide your account' },
  { number: '2', text: 'Our engine identifies narrative patterns' },
  { number: '3', text: 'Investigators review merged timelines' },
]

export default function HowItWorks() {
  return (
    <div className="bg-white/90 backdrop-blur-md border-2 border-[#C3CC9B] rounded-2xl p-8 shadow-[0_4px_20px_rgba(154,177,122,0.15)] mt-8">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-[#9AB17A] via-[#C3CC9B] to-[#E4DFB5] rounded-full mb-6" aria-hidden="true" />
      <h2 className="text-2xl font-semibold text-center text-[#5a7a5a] mb-8 font-serif-display">
        How It Works
      </h2>
      <div className="grid md:grid-cols-3 gap-6 text-center">
        {steps.map((step) => (
          <div key={step.number}>
            <div className="text-3xl font-bold text-[#9AB17A] mb-2 font-serif-display">
              {step.number}
            </div>
            <p className="text-gray-600">{step.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
