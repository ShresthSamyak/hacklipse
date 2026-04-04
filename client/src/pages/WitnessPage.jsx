import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import InputField from '../components/ui/InputField'
import Button from '../components/ui/Button'
import AudioRecorder from '../components/testimony/AudioRecorder'
import { runDemoPipeline } from '../services/api'

export default function WitnessPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [caseNumber, setCaseNumber] = useState('')
  const [incidentDate, setIncidentDate] = useState('')
  const [statementText, setStatementText] = useState('')

  // API state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleStep1 = (e) => {
    e.preventDefault()
    if (!caseNumber.trim() || !incidentDate) {
      return alert('Please fill in both fields')
    }
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!statementText.trim()) return alert('Please provide your statement (text or audio)')

    setLoading(true)
    setError(null)

    try {
      const data = await runDemoPipeline(statementText, {
        fastPreview: false,
        demoMode: true,
      })
      localStorage.setItem('lastPipelineResult', JSON.stringify(data))
      localStorage.setItem('currentCase', caseNumber)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #FDF8F0 0%, #E4DFB5 100%)' }}
      >
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6">
            <div className="w-20 h-20 border-4 border-[#C3CC9B] border-t-[#9AB17A] rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-[#2d3a2d] mb-2 font-serif-display">Processing Statement</h2>
          <p className="text-[#5a6b5a] text-sm">
            Running AI analysis pipeline…
          </p>
        </div>
      </div>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────────
  if (result) {
    const eventCount = result.events?.length ?? 0
    const conflictCount = result.conflicts?.conflict_count ?? result.conflicts?.conflicts?.length ?? 0

    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #FDF8F0 0%, #E4DFB5 100%)' }}
      >
        <div className="text-center max-w-md w-full">
          <div className="w-20 h-20 bg-gradient-to-br from-[#9AB17A] to-[#C3CC9B] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <i className="fas fa-check text-3xl text-white" aria-hidden="true" />
          </div>
          <h2 className="text-3xl font-bold text-[#2d3a2d] mb-4 font-serif-display">Statement Submitted</h2>
          <p className="text-gray-600 mb-6">
            Statement submitted and analysed successfully. Thank you for your cooperation.
          </p>

          <div className="bg-white/90 border border-[rgba(154,177,122,0.3)] rounded-xl p-5 mb-6 text-left shadow">
            <h3 className="font-semibold text-[#2d3a2d] mb-3 font-serif-display">Analysis Summary</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-[rgba(154,177,122,0.1)] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Events Extracted</p>
                <p className="text-2xl font-bold text-[#9AB17A]">{eventCount}</p>
              </div>
              <div className="bg-[rgba(228,223,181,0.4)] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Conflicts Found</p>
                <p className="text-2xl font-bold text-amber-600">{conflictCount}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => navigate('/investigator')}>
              <i className="fas fa-magnifying-glass mr-2" />
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

  // ── Main form ────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen p-8"
      style={{ background: 'linear-gradient(135deg, #FDF8F0 0%, #E4DFB5 100%)' }}
    >
      <div className="max-w-3xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#9AB17A] hover:text-[#7a9a5a] hover:-translate-x-1 transition-all font-medium mb-8"
          aria-label="Back to home"
        >
          <i className="fas fa-arrow-left" aria-hidden="true" />
          Back to Home
        </Link>

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-md border border-[rgba(154,177,122,0.3)] rounded-2xl p-8 shadow-[0_4px_20px_rgba(154,177,122,0.15)]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9AB17A] to-[#C3CC9B] flex items-center justify-center font-bold text-white text-lg mx-auto mb-4 shadow-[0_4px_15px_rgba(154,177,122,0.3)]" aria-hidden="true">
              {step}
            </div>
            <h1 className="text-3xl font-bold gradient-text-sage mb-3 font-serif-display">
              Witness Statement
            </h1>
            <p className="text-gray-600">Your observations matter. Help us understand what you witnessed.</p>
          </div>

          {/* Confidentiality info */}
          <div className="bg-gradient-to-r from-[rgba(154,177,122,0.1)] to-[rgba(195,204,155,0.1)] border-l-4 border-[#9AB17A] rounded-lg p-4 mb-6" role="note">
            <div className="flex items-start gap-3">
              <i className="fas fa-shield-alt text-[#9AB17A] text-xl mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Your Statement is Confidential</h3>
                <p className="text-sm text-gray-600">
                  Your identity will be protected. Only certified investigators will have access to your statement.
                </p>
              </div>
            </div>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={handleStep1} aria-label="Step 1: Case and date" className="space-y-6">
              <InputField
                id="witness-case-number"
                label="Case Number"
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="Enter case number"
                required
              />
              <InputField
                id="witness-incident-date"
                label="Date of Incident"
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                required
              />
              <Button variant="primary" fullWidth type="submit">Continue</Button>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit} aria-label="Step 2: Your statement" className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 flex items-start gap-2">
                  <i className="fas fa-circle-exclamation mt-0.5 text-red-500" aria-hidden="true" />
                  <div>
                    <strong>Submission failed:</strong> {error}
                    <br />
                    <span className="text-xs text-red-500">Make sure the backend is running on port 8000.</span>
                  </div>
                </div>
              )}

              <InputField
                id="witness-statement"
                label="Your Statement"
                type="textarea"
                value={statementText}
                onChange={(e) => setStatementText(e.target.value)}
                placeholder="Describe what you witnessed in as much detail as you can remember..."
                rows={8}
              />

              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-4">Or record your statement</p>
                <AudioRecorder waveSize="lg" />
              </div>

              <div className="flex gap-4">
                <Button variant="secondary" fullWidth type="button" onClick={() => setStep(1)}>Back</Button>
                <Button variant="primary" fullWidth type="submit">Submit Statement</Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
