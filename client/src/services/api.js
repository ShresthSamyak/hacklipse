/**
 * Axios API service layer for Narrative Merge Engine
 * Proxied via Vite dev server → avoids CORS entirely.
 * All requests go to /api/v1/* which Vite forwards to http://localhost:8000
 *
 * Auth: No auth needed — backend bypasses JWT in development mode.
 */

import axios from 'axios'

// ── Axios instance ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180_000, // 3 mins — LLM calls + native SDK backoff can take a while
})

// ── Response interceptor (uniform error shape) ─────────────────────────────────
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const detail =
      err?.response?.data?.detail ||
      err?.message ||
      'Unknown error'
    return Promise.reject(new Error(String(detail)))
  }
)

// ═══════════════════════════════════════════════════════════════════════════════
// DEMO PIPELINE  — the main all-in-one endpoint used by Survivor/Witness submit
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Run the full 5-stage pipeline from text input.
 * Returns: { pipeline_id, transcript, events, timeline, conflicts, status, ... }
 *
 * @param {string} text  Raw testimony text
 * @param {Object} opts
 * @param {boolean} opts.fastPreview  true = events-only, false (default) = full pipeline
 * @param {boolean} opts.demoMode     force deterministic LLM output (default true)
 * @param {Record<string,string>|null} opts.branches  multi-witness map  { "Witness_A": "...", "Witness_B": "..." }
 */
export const runDemoPipeline = (text, { fastPreview = false, demoMode = true, branches = null } = {}) =>
  api.post('/demo/run-text', {
    text,
    demo_mode: demoMode,
    fast_preview: fastPreview,
    branches,
  })

/**
 * Return pre-built sample result — zero LLM calls. Use as skeleton / fallback.
 */
export const getDemoSample = () => api.get('/demo/sample')

/**
 * Pipeline health check — tells us if all services are wired up.
 */
export const getDemoHealth = () => api.get('/demo/health')

// ═══════════════════════════════════════════════════════════════════════════════
// TESTIMONIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Ingest a new testimony.
 * @param {{ narrator_role: string, raw_text: string, case_id?: string, incident_date?: string }} payload
 */
export const createTestimony = (payload) => api.post('/testimonies/', payload)

/**
 * List testimonies (paginated).
 * @param {number} page
 * @param {number} pageSize
 */
export const listTestimonies = (page = 1, pageSize = 20) =>
  api.get('/testimonies/', { params: { page, page_size: pageSize } })

/**
 * Get a single testimony by UUID.
 * @param {string} id
 */
export const getTestimony = (id) => api.get(`/testimonies/${id}`)

/**
 * Delete a testimony.
 * @param {string} id
 */
export const deleteTestimony = (id) => api.delete(`/testimonies/${id}`)

// ═══════════════════════════════════════════════════════════════════════════════
// EVENTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract events from raw text, without DB persistence (fast preview).
 * @param {string} text
 */
export const extractEventsPreview = (text) =>
  api.post('/events/extract-preview', { text })

/**
 * Extract and persist events for a testimony already in the DB.
 * @param {string} testimonyId
 */
export const extractEvents = (testimonyId) =>
  api.post(`/events/testimonies/${testimonyId}/extract`)

/**
 * List persisted events for a testimony.
 * @param {string} testimonyId
 */
export const listEvents = (testimonyId) =>
  api.get(`/events/testimonies/${testimonyId}`)

// ═══════════════════════════════════════════════════════════════════════════════
// TIMELINES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * List all timelines (paginated).
 */
export const listTimelines = (page = 1, pageSize = 20) =>
  api.get('/timelines/', { params: { page, page_size: pageSize } })

/**
 * Get a single timeline by UUID.
 * @param {string} id
 */
export const getTimeline = (id) => api.get(`/timelines/${id}`)

// ═══════════════════════════════════════════════════════════════════════════════
// CONFLICTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Preview conflict detection from raw branches — no DB persistence.
 * @param {Record<string, Array<{id:string, description:string}>>} branches
 */
export const detectConflictsPreview = (branches) =>
  api.post('/conflicts/detect-preview', { branches })

/**
 * List conflicts persisted for a timeline.
 * @param {string} timelineId
 */
export const listConflicts = (timelineId) =>
  api.get(`/conflicts/timelines/${timelineId}`)

/**
 * Resolve a conflict.
 * @param {string} conflictId
 * @param {{ resolution_note: string }} payload
 */
export const resolveConflict = (conflictId, payload) =>
  api.patch(`/conflicts/${conflictId}/resolve`, payload)

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * List AI-generated questions for a timeline.
 * @param {string} timelineId
 */
export const listQuestions = (timelineId) =>
  api.get(`/questions/timelines/${timelineId}`)

/**
 * Answer a question.
 * @param {string} questionId
 * @param {{ answer: string }} payload
 */
export const answerQuestion = (questionId, payload) =>
  api.patch(`/questions/${questionId}/answer`, payload)

// ═══════════════════════════════════════════════════════════════════════════════
// SPEECH-TO-TEXT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Transcribe an audio File object.
 * @param {File} audioFile
 * @param {string} language  ISO 639-1, e.g. "en" — blank = auto-detect
 */
export const transcribeAudio = (audioFile, language = '') => {
  const form = new FormData()
  form.append('file', audioFile)
  form.append('language', language)
  return api.post('/stt/transcribe', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════════════════════════

/** Top-level health check — proxied through Vite. */
export const checkHealth = () =>
  axios.get('/health').then((r) => r.data)

export default api
