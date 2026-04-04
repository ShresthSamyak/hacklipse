import { useState, useEffect, useCallback } from 'react'
import CaseStats from '../components/investigator/CaseStats'
import EventTimeline from '../components/investigator/EventTimeline'
import ConflictAnalysis from '../components/investigator/ConflictAnalysis'
import SuggestedQuestions from '../components/investigator/SuggestedQuestions'
import Modal from '../components/ui/Modal'
import InputField from '../components/ui/InputField'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { getDemoSample, checkHealth } from '../services/api'
import { runInvestigation } from '../shared/api/investigatorService'
import GraphView from '../components/investigator/GraphView'
import ChatPanel from '../components/investigator/ChatPanel'

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
  const [sentTestimonies, setSentTestimonies] = useState([])
  const [userTestimonyText, setUserTestimonyText] = useState('')

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

  // ── Run full multi-testimony pipeline ──────────────────────────────────────
  const handleRunDemo = useCallback(async (fastPreview = false) => {
    setError(null)
    const text = userTestimonyText.trim()
    
    let testimonies = []
    if (text) {
      testimonies.push({ witness_id: "Witness_A", text })
    }

    if (testimonies.length === 1) {
      testimonies.push({
        witness_id: "Witness_B",
        text: "There are slight inconsistencies in timing compared to earlier testimony."
      })
    }

    if (testimonies.length < 2) {
      setError("Add at least 2 witnesses to detect conflicts")
      return
    }

    setLoading(true)
    setResult(null) // Prevent mixing with old runs
    try {
      setSentTestimonies(testimonies)
      const data = await runInvestigation({
        testimonies,
        mode: "investigator"
      })
      console.log("NEW PIPELINE RUN:", data.pipeline_id)
      setResult(data)
      localStorage.setItem('lastPipelineResult', JSON.stringify(data))
    } catch (err) {
      setError("Analysis failed. Please retry.")
    } finally {
      setLoading(false)
    }
  }, [userTestimonyText])

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
  // Use only grounded events for display — filter out hallucinated ones
  const rawEvents = result?.timeline?.events || []
  const events = rawEvents.filter(e => e.grounded !== false)
  const conflictsData = result?.conflicts?.conflicts || []
  // Ensure conflicts and next_question refer strictly to the exact path
  const conflictsObj = result?.conflicts ?? null
  const pipelineStatus = result?.status ?? null
  const groundingStats = result?.grounding_stats ?? null
  const risk = result?.risk_assessment ?? null
  const safetyFlag = result?.safety_flag ?? false

  if (result) {
    console.log("PIPELINE RESULT:", result)
    if (groundingStats) {
      console.log("GROUNDING STATS:", groundingStats)
    }
  }

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

            {/* ── Input UI ── */}
            <div className="mb-6 bg-white/80 p-6 rounded-xl border border-[#9AB17A]">
              <InputField
                id="investigator-testimony"
                label="Submit Testimony for Analysis (Witness A)"
                type="textarea"
                value={userTestimonyText}
                onChange={(e) => setUserTestimonyText(e.target.value)}
                placeholder="Enter testimony... (A simulated Witness B will be auto-generated to demonstrate conflict detection)"
                rows={3}
              />
            </div>

            {/* ── Action toolbar ── */}
            <div className="flex flex-wrap gap-3 items-center">
              <Button
                variant="primary"
                onClick={() => handleRunDemo(false)}
                disabled={loading || backendOk === false}
              >
                {loading
                  ? <><i className="fas fa-spinner fa-spin mr-2" />Analyzing multiple testimonies...</>
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
                  pipelineStatus === 'blocked'  ? 'bg-red-100  border-red-400   text-red-800'   :
                                                  'bg-red-50   border-red-300   text-red-700'
                }`}>
                  <i className={`fas mr-1.5 ${pipelineStatus === 'blocked' ? 'fa-ban' : 'fa-server'}`}></i>
                  Pipeline: {pipelineStatus.toUpperCase()}
                </span>
              )}

              {safetyFlag && (
                <span 
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold border bg-yellow-50 border-yellow-400 text-yellow-800 group relative cursor-help"
                >
                  <span>⚠️ Sensitive Input Detected</span>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 min-w-48 max-w-64 z-[100] hidden group-hover:block bg-gray-900 text-white text-xs p-2 rounded shadow-xl pointer-events-none whitespace-normal text-center">
                    {result?.safety_reason || "Sensitive material was evaluated and processed securely."}
                  </div>
                </span>
              )}

              {risk && (
                <span 
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold border group relative cursor-help ${
                    risk.risk_level === 'low'    ? 'bg-green-50 border-green-300 text-green-700' :
                    risk.risk_level === 'medium' ? 'bg-amber-50 border-amber-300 text-amber-700' :
                                                   'bg-red-50   border-red-300   text-red-700'
                  }`}
                  title={risk.explanation}
                >
                  <i className={`fas ${
                    risk.risk_level === 'low'    ? 'fa-shield-check' :
                    risk.risk_level === 'medium' ? 'fa-triangle-exclamation' :
                                                   'fa-skull-crossbones'
                  }`} />
                  Risk: {risk.risk_level?.toUpperCase() || 'UNKNOWN'}
                  
                  {/* Tooltip on hover */}
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 min-w-48 max-w-64 z-[100] hidden group-hover:block bg-gray-900 text-white text-xs p-2 rounded shadow-xl pointer-events-none whitespace-normal text-center">
                    <div className="font-semibold mb-1">{risk.explanation}</div>
                    {risk.recommendation && (
                      <div className="text-gray-300 italic">{risk.recommendation}</div>
                    )}
                  </div>
                </span>
              )}
            </div>

            {/* Error banner */}
            {error && result?.status !== "blocked" && (
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

            {/* Blocked banner */}
            {result?.status === "blocked" && (
              <div className="mt-4 bg-red-100 border border-red-400 rounded-xl p-4 text-sm text-red-800 flex items-start gap-4 shadow-sm">
                <i className="fas fa-shield-slash mt-1 text-xl text-red-600" aria-hidden="true" />
                <div>
                  <strong className="text-base">⚠️ Input blocked due to safety concerns</strong>
                  <div className="mt-1 text-red-700 font-medium">
                    {result?.safety_reason || result?.errors?.[0] || 'The safety evaluation layer prevented this execution.'}
                  </div>
                </div>
              </div>
            )}

            {/* Recommended Action Panel */}
            {risk?.recommendation && result?.status !== "blocked" && (
              <div className="mt-6 bg-gray-900 border border-gray-700 rounded-xl p-5 shadow-inner flex items-start gap-4 transition-all hover:border-gray-600">
                <div className={`mt-0.5 text-2xl ${
                  risk.risk_level === 'low'    ? 'text-green-500' :
                  risk.risk_level === 'medium' ? 'text-yellow-500' : 
                                                 'text-red-500'
                }`}>
                  <i className={`fas ${
                    risk.risk_level === 'low'    ? 'fa-circle-check' :
                                                   'fa-triangle-exclamation'
                  }`} />
                </div>
                <div>
                  <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1.5">Recommended Action</h4>
                  <div className={`text-base font-medium leading-relaxed ${
                    risk.risk_level === 'low'    ? 'text-green-400' :
                    risk.risk_level === 'medium' ? 'text-yellow-400' : 
                                                 'text-red-400'
                  }`}>
                    {risk.recommendation}
                  </div>
                </div>
              </div>
            )}

            {/* Fallback/Partial Warnings */}
            {result?.status === "fallback" && (
              <div className="mt-4 bg-[#fff8e6] border border-[#f5c6cb] rounded-xl p-4 text-sm text-[#856404] flex items-start gap-3">
                <div>
                  ⚠️ Full AI analysis partially failed. Showing simplified results.
                </div>
              </div>
            )}
            
            {result?.status === "partial" && (
              <div className="mt-4 bg-[#fff8e6] border border-[#f5c6cb] rounded-xl p-4 text-sm text-[#856404] flex items-start gap-3">
                <div>
                  ⚠️ Some stages failed. Results may be incomplete.
                </div>
              </div>
            )}

            {/* Analysis Summary (Detailed Report) */}
            {result?.report?.summary && (
              <div className="mt-6 bg-[#FBE8CE] border border-amber-200 rounded-xl p-5 text-sm text-gray-800 shadow-sm">
                <p className="font-semibold text-amber-700 mb-2 text-base font-serif-display">
                  <i className="fas fa-file-alt mr-2" />
                  Investigation Detailed Report
                </p>
                <div className="space-y-4">
                  <p className="leading-relaxed">{result.report.summary}</p>
                  
                  {result.report.key_events?.length > 0 && (
                    <div>
                      <strong className="text-amber-800">Key Events:</strong>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {result.report.key_events.map((ke, idx) => (
                          <li key={idx} className="leading-relaxed">{ke}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.report.emotional_analysis && (
                       <div className="bg-white/50 p-3 rounded border border-amber-100">
                         <strong className="text-amber-800 block mb-1">Emotion Analysis</strong>
                         <p>{result.report.emotional_analysis}</p>
                       </div>
                    )}
                    {result.report.uncertainty_analysis && (
                       <div className="bg-white/50 p-3 rounded border border-amber-100">
                         <strong className="text-amber-800 block mb-1">Uncertainty Context</strong>
                         <p>{result.report.uncertainty_analysis}</p>
                       </div>
                    )}
                  </div>

                  {result.report.recommended_next_steps?.length > 0 && (
                    <div>
                      <strong className="text-amber-800">Recommended Next Steps:</strong>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {result.report.recommended_next_steps.map((ns, idx) => (
                          <li key={idx} className="leading-relaxed">{ns}</li>
                        ))}
                      </ul>
                    </div>
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
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 font-serif-display flex-wrap">
                <i className="fas fa-timeline text-[#9AB17A]" aria-hidden="true" />
                Event Timeline
                {result && (
                  <span className="ml-auto text-xs font-mono-code text-gray-500 font-normal">
                    {events.length} event{events.length !== 1 ? 's' : ''}
                    {groundingStats?.ungrounded_count > 0 && (
                      <span className="ml-2 text-amber-600">
                        ({groundingStats.ungrounded_count} hallucinated removed)
                      </span>
                    )}
                  </span>
                )}
              </h3>
              {groundingStats && groundingStats.total_events > 0 && (
                <div className={`mb-4 px-3 py-2 rounded-lg text-xs font-mono-code flex items-center gap-2 ${
                  groundingStats.grounding_rate >= 0.9
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : groundingStats.grounding_rate >= 0.6
                    ? 'bg-amber-50 border border-amber-200 text-amber-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  <i className={`fas ${groundingStats.grounding_rate >= 0.9 ? 'fa-check-circle' : 'fa-shield-halved'}`} />
                  Grounding: {Math.round(groundingStats.grounding_rate * 100)}% verified
                  <span className="text-gray-500 ml-1">
                    ({groundingStats.grounded_count}/{groundingStats.total_events} events backed by testimony)
                  </span>
                </div>
              )}
              <EventTimeline events={events} loading={loading} />
            </section>

            <section
              aria-label="Conflict Analysis"
              className="bg-white/85 backdrop-blur-md border border-[#C3CC9B] rounded-2xl p-8 shadow-[0_8px_32px_rgba(154,177,122,0.1)]"
            >
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 font-serif-display">
                <i className="fas fa-triangle-exclamation text-amber-600" aria-hidden="true" />
                Conflict Analysis
                {conflictsObj?.conflict_count != null && (
                  <span className="ml-auto text-xs font-mono-code text-gray-500 font-normal">
                    {conflictsObj.conflict_count} conflict{conflictsObj.conflict_count !== 1 ? 's' : ''}
                  </span>
                )}
              </h3>
              <ConflictAnalysis conflicts={conflictsObj} conflictsData={conflictsData} loading={loading} />
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
            {/* Provide question directly if available */}
            <SuggestedQuestions
              questions={null}
              nextQuestion={result?.next_question}
              conflicts={conflictsObj}
              loading={loading}
            />
          </section>

          {/* ── Testimony Divergence Graph ── */}
          <section aria-label="Testimony Divergence Graph" className="mt-8">
            <GraphView key={result?.pipeline_id || 'empty-graph'} result={result} testimonies={sentTestimonies} />
          </section>

          {/* ── Investigation Chat ── */}
          <section aria-label="Investigation Assistant" className="mt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-3 font-serif-display">
              <i className="fas fa-comments text-[#9AB17A]" aria-hidden="true" />
              Investigation Assistant
              <span className="ml-auto text-xs font-mono-code text-gray-500 font-normal">Ask questions about the case</span>
            </h3>
            <ChatPanel result={result} />
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
