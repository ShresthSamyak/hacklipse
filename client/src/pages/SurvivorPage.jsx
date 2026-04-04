import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import StepIndicator from '../components/ui/StepIndicator'
import InputField from '../components/ui/InputField'
import Button from '../components/ui/Button'
import AudioRecorder from '../components/testimony/AudioRecorder'
import { runDemoPipeline } from '../services/api'

export default function SurvivorPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [caseId, setCaseId] = useState('')
  const [incidentDate, setIncidentDate] = useState('')
  const [testimonyText, setTestimonyText] = useState('')

  // API state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const goToStep = (n) => setStep(n)

  const handleStep1 = (e) => {
    e.preventDefault()
    if (!caseId.trim()) return alert('Please enter a case ID')
    setStep(2)
  }

  const handleStep2 = (e) => {
    e.preventDefault()
    if (!incidentDate) return alert('Please select a date')
    setStep(3)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!testimonyText.trim()) return alert('Please provide your testimony (text or audio)')

    setLoading(true)
    setError(null)

    try {
      const data = await runDemoPipeline(testimonyText, {
        fastPreview: false,
        demoMode: true,
      })
      // Store in localStorage so Investigator can read it
      localStorage.setItem('lastPipelineResult', JSON.stringify(data))
      localStorage.setItem('currentCase', caseId)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Loading spinner ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #FDF8F0 0%, #E4DFB5 100%)' }}
      >
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="w-20 h-20 border-4 border-[#C3CC9B] border-t-[#9AB17A] rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-[#2d3a2d] mb-2 font-serif-display">Analysing Testimony</h2>
          <p className="text-[#5a6b5a] text-sm">
            Running AI pipeline: event extraction → timeline reconstruction → conflict detection…
          </p>
        </div>
      </div>
    )
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (result) {
    const eventCount = result.events?.length ?? 0
    const conflictCount = result.conflicts?.conflict_count ?? result.conflicts?.conflicts?.length ?? 0
    const pipelineStatus = result.status ?? 'success'

    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #FDF8F0 0%, #E4DFB5 100%)' }}
      >
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 bg-gradient-to-br from-[#9AB17A] to-[#C3CC9B] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <i className="fas fa-check text-3xl text-white" aria-hidden="true" />
          </div>
          <h2 className="text-3xl font-bold text-[#2d3a2d] mb-4 font-serif-display">Thank You</h2>
          <p className="text-gray-600 mb-6">
            Your testimony has been submitted and processed successfully.
          </p>

          {/* Pipeline summary */}
          <div className="bg-white/90 border border-[rgba(154,177,122,0.3)] rounded-xl p-5 mb-6 text-left shadow">
            <h3 className="font-semibold text-[#2d3a2d] mb-3 font-serif-display">Pipeline Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-[rgba(154,177,122,0.1)] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Events Extracted</p>
                <p className="text-2xl font-bold text-[#9AB17A]">{eventCount}</p>
              </div>
              <div className="bg-[rgba(228,223,181,0.4)] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Conflicts Found</p>
                <p className="text-2xl font-bold text-amber-600">{conflictCount}</p>
              </div>
              <div className="col-span-2 bg-[rgba(154,177,122,0.05)] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Pipeline Status</p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                  pipelineStatus === 'success' ? 'bg-green-100 text-green-700' :
                  pipelineStatus === 'partial' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {pipelineStatus.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => navigate('/investigator')}>
              <i className="fas fa-magnifying-glass mr-2" aria-hidden="true" />
              View Analysis
            </Button>
            <Button variant="primary" fullWidth onClick={() => navigate('/')}>
              Return Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Error banner (shown inline at step 3) ────────────────────────────────────
  const ErrorBanner = () =>
    error ? (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-sm text-red-700 flex items-start gap-2">
        <i className="fas fa-circle-exclamation mt-0.5 text-red-500" aria-hidden="true" />
        <div>
          <strong>Submission failed:</strong> {error}
          <br />
          <span className="text-xs text-red-500">Make sure the backend is running on port 8000.</span>
        </div>
      </div>
    ) : null

  // ── Main multi-step form ─────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #FDF8F0 0%, #E4DFB5 100%)' }}
    >
      <header className="py-6 px-8">
        <Link
          to="/"
          className="inline-flex items-center text-[#9AB17A] hover:opacity-80 transition-opacity font-medium"
          aria-label="Back to home"
        >
          <i className="fas fa-arrow-left mr-2" aria-hidden="true" />
          Back
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#9AB17A] flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              <i className="fas fa-heart text-2xl text-white" />
            </div>
            <h1 className="text-4xl font-bold text-[#2d3a2d] mb-3 font-serif-display">
              Your Story Matters
            </h1>
            <p className="text-lg text-[#5a6b5a]">This is a safe space. Share what you're comfortable with.</p>
          </div>

          {/* Card */}
          <div className="bg-white/90 backdrop-blur-md border border-[rgba(154,177,122,0.3)] rounded-2xl p-8 shadow-[0_4px_20px_rgba(154,177,122,0.15)]">
            {/* Progress */}
            <div className="flex items-center justify-between mb-8">
              <StepIndicator totalSteps={3} currentStep={step} />
              <span className="font-mono-code text-sm text-[#9AB17A]">
                Case: <span aria-live="polite">{caseId || 'Not set'}</span>
              </span>
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <form onSubmit={handleStep1} aria-label="Step 1: Enter Case ID">
                <h2 className="text-2xl font-semibold text-[#2d3a2d] mb-4 font-serif-display">
                  Enter Your Case ID
                </h2>
                <p className="text-[#5a6b5a] mb-6">Your case ID was provided to you by the investigator.</p>
                <InputField
                  id="survivor-case-id"
                  type="text"
                  value={caseId}
                  onChange={(e) => setCaseId(e.target.value)}
                  placeholder="e.g., CASE-2024-001"
                  required
                  className="mb-4"
                />
                <Button variant="primary" fullWidth type="submit">
                  Continue <i className="fas fa-arrow-right ml-2" aria-hidden="true" />
                </Button>
              </form>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <form onSubmit={handleStep2} aria-label="Step 2: When did this occur?">
                <h2 className="text-2xl font-semibold text-[#2d3a2d] mb-4 font-serif-display">
                  When Did This Occur?
                </h2>
                <p className="text-[#5a6b5a] mb-6">Select the date of the incident you're reporting.</p>
                <InputField
                  id="survivor-incident-date"
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  required
                  className="mb-4"
                />
                <div className="flex gap-3">
                  <Button variant="secondary" fullWidth type="button" onClick={() => goToStep(1)}>
                    <i className="fas fa-arrow-left mr-2" aria-hidden="true" /> Back
                  </Button>
                  <Button variant="primary" fullWidth type="submit">
                    Continue <i className="fas fa-arrow-right ml-2" aria-hidden="true" />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <form onSubmit={handleSubmit} aria-label="Step 3: Share your experience">
                <h2 className="text-2xl font-semibold text-[#2d3a2d] mb-4 font-serif-display">
                  Share Your Experience
                </h2>
                <p className="text-[#5a6b5a] mb-6">You can type or record your testimony. Take your time.</p>

                <ErrorBanner />

                <InputField
                  id="survivor-testimony"
                  type="textarea"
                  value={testimonyText}
                  onChange={(e) => setTestimonyText(e.target.value)}
                  placeholder="Type your testimony here..."
                  rows={6}
                  className="mb-4"
                />

                <div className="border-t border-[#C3CC9B] pt-4 mt-4">
                  <h3 className="font-semibold text-[#2d3a2d] mb-3">Or Record Audio</h3>
                  <AudioRecorder waveSize="sm" />
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="secondary" fullWidth type="button" onClick={() => goToStep(2)}>
                    <i className="fas fa-arrow-left mr-2" aria-hidden="true" /> Back
                  </Button>
                  <Button variant="primary" fullWidth type="submit">
                    <i className="fas fa-check mr-2" aria-hidden="true" /> Submit Testimony
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Confidentiality note */}
          <p className="text-sm text-center text-[#5a6b5a] mt-6">
            <i className="fas fa-shield-alt mr-1 text-[#9AB17A]" aria-hidden="true" />
            Your testimony is confidential and protected
          </p>
        </div>
      </main>
    </div>
  )
}
