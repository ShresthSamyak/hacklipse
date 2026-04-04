import { useState, useEffect, useCallback } from 'react'
import CaseStats from '../components/investigator/CaseStats'
import EventTimeline from '../components/investigator/EventTimeline'
import ConflictAnalysis from '../components/investigator/ConflictAnalysis'
import SuggestedQuestions from '../components/investigator/SuggestedQuestions'
import Modal from '../components/ui/Modal'
import InputField from '../components/ui/InputField'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { runDemoPipeline, getDemoSample, checkHealth } from '../services/api'

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Derive CaseStats numbers from a PipelineResponse. */
function deriveStats(result) {
  if (!result) return null
  const events    = result.events ?? []
  const conflicts = result.conflicts?.conflicts ?? result.conflicts?.conflict_count ?? 0
  const conflictCount = typeof conflicts === 'number' ? conflicts : conflicts.length

  // Avg confidence from timeline
  const summary = result.timeline?.confidence_summary
  let confidence = null
  if (summary) {
    const total = (summary.confirmed ?? 0) + (summary.probable ?? 0) + (summary.uncertain ?? 0)
    if (total > 0) {
      confidence = ((summary.confirmed ?? 0) * 1.0 + (summary.probable ?? 0) * 0.6) / total
    }
  }

  return {
    testimonies: 1,         // one pipeline run = one processed testimony
    conflicts: conflictCount,
    confidence,
  }
}

/** Extract a flat event array for the timeline from a PipelineResponse. */
function extractEvents(result) {
  if (!result) return []

  // Prefer timeline sequences which have placement_confidence
  const timeline = result.timeline
  if (timeline) {
    const combined = [
      ...(timeline.confirmed_sequence ?? []),
      ...(timeline.probable_sequence  ?? []),
      ...(timeline.uncertain_events   ?? []),
    ]
    if (combined.length > 0) return combined
  }

  // Fallback to raw event list
  return result.events ?? []
}

// ═══════════════════════════════════════════════════════════════════════════════

export default function InvestigatorPage() {
  const [currentCase, setCurrentCase] = useState(
    () => localStorage.getItem('currentCase') || null
  )
  const [modalOpen, setModalOpen]   = useState(false)
  const [caseInput, setCaseInput]   = useState('')

  // Pipeline state
  const [result,  setResult]  = useState(() => {
    try {
      const raw = localStorage.getItem('lastPipelineResult')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [backendOk, setBackendOk] = useState(null) // null=unknown, true=ok, false=down

  // ── Check backend health on mount ──────────────────────────────────────────
  useEffect(() => {
    checkHealth()
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false))
  }, [])

  // ── Case login ─────────────────────────────────────────────────────────────
  const handleCaseLogin = (e) => {
    e.preventDefault()
    if (!caseInput.trim()) return
    localStorage.setItem('currentCase', caseInput.trim())
    setCurrentCase(caseInput.trim())
    setModalOpen(false)
    setCaseInput('')
  }

  // ── Run demo pipeline ──────────────────────────────────────────────────────
  const handleRunDemo = useCallback(async (fastPreview = false) => {
    setLoading(true)
    setError(null)
    try {
      const data = await runDemoPipeline(
        'I entered the building at around 9 PM. There was someone near the table. ' +
        'I heard a loud noise about 30 minutes later and left immediately.',
        { fastPreview, demoMode: true }
      )
      setResult(data)
      localStorage.setItem('lastPipelineResult', JSON.stringify(data))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Load pre-built sample (no LLM) ────────────────────────────────────────
  const handleLoadSample = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDemoSample()
      setResult(data)
      localStorage.setItem('lastPipelineResult', JSON.stringify(data))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Derived data ───────────────────────────────────────────────────────────
  const stats   = deriveStats(result)
  const events  = extractEvents(result)
  const conflicts = result?.conflicts ?? null
  const pipelineStatus = result?.status ?? null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className="min-h-screen p-8"
        style={{ background: 'linear-gradient(135deg, #E4DFB5 0%, #F5F0E1 50%, #FBE8CE 100%)' }}
      >
        <div className="max-w-7xl mx-auto">

          {/* ── Header ── */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold gradient-text-sage mb-1 font-serif-display">
                  ChronoMerge
                </h1>
                <p className="text-sm font-mono-code text-gray-600">Narrative Merge Engine</p>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Backend status pill */}
                <div className={`text-xs font-mono-code px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
                  backendOk === true  ? 'bg-green-50 border-green-300 text-green-700' :
                  backendOk === false ? 'bg-red-50  border-red-300  text-red-600'   :
                                        'bg-gray-50 border-gray-300 text-gray-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    backendOk === true  ? 'bg-green-500' :
                    backendOk === false ? 'bg-red-500'   : 'bg-gray-400'
                  }`} />
                  {backendOk === true ? 'API online' : backendOk === false ? 'API offline' : 'checking…'}
                </div>

                <div
                  className="text-sm font-mono-code bg-white/80 px-4 py-2 rounded-lg border border-[#9AB17A]"
                  aria-live="polite"
                >
                  Case: {currentCase ?? 'Not Selected'}
                </div>

                <Button variant="secondary-dark" onClick={() => setModalOpen(true)}>
                  <i className="fas fa-folder-open mr-2" aria-hidden="true" />
                  Change Case
                </Button>
              </div>
            </div>

            {/* ── Action toolbar ── */}
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                variant="primary"
                onClick={() => handleRunDemo(false)}
                disabled={loading || backendOk === false}
              >
                {loading
                  ? <><i className="fas fa-spinner fa-spin mr-2" />Running…</>
                  : <><i className="fas fa-play mr-2" />Run Full Pipeline</>
                }
              </Button>

              <Button
                variant="secondary"
                onClick={() => handleRunDemo(true)}
                disabled={loading || backendOk === false}
              >
                <i className="fas fa-bolt mr-2" />
                Fast Preview
              </Button>

              <Button
                variant="secondary"
                onClick={handleLoadSample}
                disabled={loading}
              >
                <i className="fas fa-box-open mr-2" />
                Load Sample
              </Button>

              {pipelineStatus && (
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-mono font-semibold border ${
                  pipelineStatus === 'success'  ? 'bg-green-50 border-green-300 text-green-700' :
                  pipelineStatus === 'partial'  ? 'bg-amber-50 border-amber-300 text-amber-700' :
                  pipelineStatus === 'fallback' ? 'bg-blue-50  border-blue-300  text-blue-700'  :
                                                  'bg-red-50   border-red-300   text-red-700'
                }`}>
                  Pipeline: {pipelineStatus.toUpperCase()}
                </span>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-3">
                <i className="fas fa-circle-exclamation text-red-400 mt-0.5" aria-hidden="true" />
                <div>
                  <strong>Pipeline error:</strong> {error}
                  {backendOk === false && (
                    <><br /><span className="text-xs text-red-500">Backend appears offline at http://localhost:8000 — use "Load Sample" for demo data.</span></>
                  )}
                </div>
              </div>
            )}
          </header>

          {/* ── Case Overview ── */}
          <section
            aria-label="Case Overview"
            className="bg-white/85 backdrop-blur-md border border-[#C3CC9B] rounded-2xl p-8 mb-8 shadow-[0_8px_32px_rgba(154,177,122,0.1)]"
          >
            <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1 font-serif-display">Case Overview</h2>
                <p className="text-sm text-gray-600">Multi-testimony analysis with conflict detection</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Badge priority="high">
                  <i className="fas fa-shield-check" aria-hidden="true" /> ISO 27001
                </Badge>
                <Badge priority="high">
                  <i className="fas fa-certificate" aria-hidden="true" /> SOC 2 Type II
                </Badge>
              </div>
            </div>
            <CaseStats stats={stats} loading={loading} />
          </section>

          {/* ── Timeline & Conflicts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <section
              aria-label="Event Timeline"
              className="bg-white/85 backdrop-blur-md border border-[#C3CC9B] rounded-2xl p-8 shadow-[0_8px_32px_rgba(154,177,122,0.1)]"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 font-serif-display">
                <i className="fas fa-timeline text-[#9AB17A]" aria-hidden="true" />
                Event Timeline
                {result && (
                  <span className="ml-auto text-xs font-mono-code text-gray-500 font-normal">
                    {events.length} event{events.length !== 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              <EventTimeline events={events} loading={loading} />
            </section>

            <section
              aria-label="Conflict Analysis"
              className="bg-white/85 backdrop-blur-md border border-[#C3CC9B] rounded-2xl p-8 shadow-[0_8px_32px_rgba(154,177,122,0.1)]"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 font-serif-display">
                <i className="fas fa-triangle-exclamation text-amber-600" aria-hidden="true" />
                Conflict Analysis
                {conflicts?.conflict_count != null && (
                  <span className="ml-auto text-xs font-mono-code text-gray-500 font-normal">
                    {conflicts.conflict_count} conflict{conflicts.conflict_count !== 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              <ConflictAnalysis conflicts={conflicts} loading={loading} />
            </section>
          </div>

          {/* ── Suggested Questions ── */}
          <section
            aria-label="Suggested Next Questions"
            className="bg-white/85 backdrop-blur-md border border-[#C3CC9B] rounded-2xl p-8 shadow-[0_8px_32px_rgba(154,177,122,0.1)]"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 font-serif-display">
              <i className="fas fa-circle-question text-[#9AB17A]" aria-hidden="true" />
              Suggested Next Questions
            </h3>
            <SuggestedQuestions
              questions={null}
              conflicts={conflicts}
              loading={loading}
            />
          </section>

          {/* ── Raw transcript (collapsible) ── */}
          {result?.transcript && (
            <details className="mt-8 bg-white/70 border border-[#C3CC9B] rounded-2xl overflow-hidden">
              <summary className="px-8 py-5 cursor-pointer font-semibold text-gray-700 select-none hover:bg-white/50 transition-colors flex items-center gap-2">
                <i className="fas fa-file-lines text-[#9AB17A]" aria-hidden="true" />
                Processed Transcript
                <span className="ml-auto text-xs font-mono-code text-gray-400 font-normal">click to expand</span>
              </summary>
              <div className="px-8 py-5 border-t border-[#C3CC9B]">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono-code">
                  {result.transcript}
                </p>
              </div>
            </details>
          )}
        </div>
      </div>

      {/* ── Change Case Modal ── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Enter Case Number">
        <div className="text-center mb-6">
          <i className="fas fa-folder-open text-5xl text-[#9AB17A] mb-4" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2 font-serif-display">Enter Case Number</h2>
          <p className="text-sm text-gray-600">Access your case dashboard</p>
        </div>
        <form onSubmit={handleCaseLogin}>
          <InputField
            id="case-number-investigator"
            type="text"
            value={caseInput}
            onChange={(e) => setCaseInput(e.target.value)}
            placeholder="e.g., CASE-2024-001"
            required
            className="mb-6"
          />
          <div className="flex gap-4">
            <Button variant="primary" fullWidth type="submit">
              <i className="fas fa-sign-in-alt mr-2" aria-hidden="true" />
              Access Case
            </Button>
            <Button variant="secondary" fullWidth type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
