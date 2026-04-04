/**
 * ChatPanel.jsx
 * Interactive investigation assistant chat panel.
 * Dark-themed, message-bubble UI. Queries are answered grounded in
 * the current pipeline result (timeline, conflicts, testimonies).
 */

import { useState, useRef, useEffect, useCallback } from 'react'

// ── Constants ─────────────────────────────────────────────────────────────────
const API_BASE = 'http://127.0.0.1:8000'

const COLORS = {
  bg:       '#0d1117',
  surface:  '#161b22',
  border:   '#30363d',
  inputBg:  '#21262d',
  accent:   '#58a6ff',
  text:     '#c9d1d9',
  muted:    '#8b949e',
  userBg:   '#1f3a5f',
  userText: '#a5c8f5',
  aiBg:     '#161b22',
  aiText:   '#c9d1d9',
  error:    '#ff7b72',
  send:     '#238636',
  sendHov:  '#2ea043',
}

const EXAMPLE_QUERIES = [
  'What happened at 9 PM?',
  'Where is the conflict between witnesses?',
  'Which witness seems most reliable?',
  'Summarise the key timeline events.',
  'What is still unclear or uncertain?',
]

// ── API call ──────────────────────────────────────────────────────────────────

async function sendChatQuery({ query, context }) {
  const res = await fetch(`${API_BASE}/api/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test',
    },
    body: JSON.stringify({ query, context }),
  })

  if (!res.ok) {
    // Gateway / upstream errors get a user-friendly message
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error('LLM provider is temporarily unavailable. Please try again in a moment.')
    }
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail || `Server error ${res.status}`)
  }

  return res.json()
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '12px 14px' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: COLORS.muted,
            animation: `chatBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 12,
        animation: 'chatMsgIn 0.22s ease both',
      }}
    >
      {/* Avatar left (AI) */}
      {!isUser && (
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #58a6ff 0%, #3fb950 100%)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          marginRight: 8,
          marginTop: 2,
          boxShadow: '0 0 8px #58a6ff44',
        }}>⑂</div>
      )}

      <div
        style={{
          maxWidth: '72%',
          background: isUser ? COLORS.userBg : COLORS.aiBg,
          color: isUser ? COLORS.userText : COLORS.aiText,
          border: `1px solid ${isUser ? '#1f4080' : COLORS.border}`,
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '10px 14px',
          fontSize: 13,
          lineHeight: 1.65,
          boxShadow: isUser
            ? '0 2px 12px rgba(88,166,255,0.12)'
            : '0 2px 8px rgba(0,0,0,0.2)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}
      >
        <div>{msg.text}</div>

        {/* Evidence Block (AI only) */}
        {!isUser && msg.evidence && msg.evidence.length > 0 && (
          <div style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: `1px solid ${COLORS.border}`,
            fontSize: 11,
            color: COLORS.muted
          }}>
            <div style={{ fontWeight: 600, color: '#8b949e', marginBottom: 4 }}>
              <i className="fas fa-microscope mr-1.5" /> Based on:
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {msg.evidence.map((ev, idx) => (
                <li key={idx} style={{ lineHeight: 1.4, color: '#a5c8f5' }}>{ev}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Confidence Badge (AI only) */}
        {!isUser && msg.confidence && (
        <><div style={{
            alignSelf: 'flex-start',
            fontSize: 10,
            fontFamily: 'monospace',
            padding: '2px 8px',
            borderRadius: 12,
            background: msg.confidence === 'high' ? '#1f3322' : 
                        msg.confidence === 'medium' ? '#332912' : '#331616',
            color: msg.confidence === 'high' ? '#3fb950' : 
                   msg.confidence === 'medium' ? '#d29922' : '#f85149',
            border: `1px solid ${
              msg.confidence === 'high' ? '#3fb95044' : 
              msg.confidence === 'medium' ? '#d2992244' : '#f8514944'
            }`,
            marginTop: 4
          }}>
            <i className={`fas mr-1 text-[9px] ${
              msg.confidence === 'high' ? 'fa-check-circle' :
              msg.confidence === 'medium' ? 'fa-triangle-exclamation' : 'fa-circle-xmark'
            }`}></i>
            Confidence: {msg.confidence?.toUpperCase() || 'UNKNOWN'}
          </div>
          <div style={{
            width: 100, height: 6, borderRadius: 4, marginTop: 4,
            background: '#30363d',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: msg.confidence === 'high' ? '100%' : 
                     msg.confidence === 'medium' ? '60%' : '30%',
              background: msg.confidence === 'high' ? '#3fb950' : 
                          msg.confidence === 'medium' ? '#d29922' : '#f85149',
              transition: 'width 0.6s ease-out'
            }} />
          </div>
        </>
        )}
      </div>

      {/* Avatar right (user) */}
      {isUser && (
        <div style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#1f4080',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          marginLeft: 8,
          marginTop: 2,
          color: COLORS.accent,
          fontFamily: 'monospace',
          fontWeight: 700,
        }}>I</div>
      )}
    </div>
  )
}

function EmptyState({ onExample }) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>⑂</div>
      <p style={{ color: COLORS.muted, fontSize: 13, fontFamily: 'monospace', marginBottom: 20 }}>
        Ask anything about the case evidence
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 340 }}>
        {EXAMPLE_QUERIES.map(q => (
          <button
            key={q}
            onClick={() => onExample(q)}
            style={{
              background: COLORS.inputBg,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: '8px 12px',
              color: COLORS.text,
              fontSize: 12,
              fontFamily: 'monospace',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = COLORS.accent
              e.currentTarget.style.background = '#1f3a5f'
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = COLORS.border
              e.currentTarget.style.background = COLORS.inputBg
            }}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ChatPanel({ result }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Build context from the pipeline result
  const buildContext = useCallback(() => ({
    timeline:    result?.timeline    ?? null,
    conflicts:   result?.conflicts   ?? null,
    testimonies: result?.testimonies ?? null,
    report:      result?.report      ?? null,
  }), [result])

  const handleSend = useCallback(async (text) => {
    const query = (text ?? input).trim()
    if (!query || loading) return

    setInput('')
    setError(null)

    const userMsg = { role: 'user', text: query }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const data = await sendChatQuery({
        query,
        context: buildContext(),
      })
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: data.answer, 
        confidence: data.confidence,
        evidence: data.evidence || [] 
      }])
    } catch (err) {
      setError(err.message || 'Failed to get a response. Is the backend running?')
    } finally {
      setLoading(false)
      // Re-focus input after response
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [input, loading, buildContext])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const hasResult = Boolean(result)

  return (
    <>
      {/* Keyframe animations */}
      <style>{`
        @keyframes chatMsgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        height: 540,
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '12px 18px',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: COLORS.surface,
          flexShrink: 0,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: hasResult ? '#3fb950' : COLORS.muted,
            boxShadow: hasResult ? '0 0 6px #3fb95088' : 'none',
          }} />
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f0f6fc', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
            Investigation Assistant
          </h2>
          <span style={{ marginLeft: 'auto', fontSize: 10, color: COLORS.muted, fontFamily: 'monospace' }}>
            {hasResult ? 'Case context loaded' : 'Run pipeline first'}
          </span>
        </div>

        {/* ── Messages area ── */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px 8px',
          scrollbarWidth: 'thin',
          scrollbarColor: `${COLORS.border} transparent`,
        }}>
          {messages.length === 0
            ? <EmptyState onExample={(q) => handleSend(q)} />
            : messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))
          }
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                background: COLORS.aiBg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '18px 18px 18px 4px',
              }}>
                <TypingIndicator />
              </div>
            </div>
          )}
          {error && (
            <div style={{
              background: '#2d0e0e',
              border: `1px solid ${COLORS.error}44`,
              borderRadius: 8,
              padding: '10px 14px',
              color: COLORS.error,
              fontSize: 12,
              fontFamily: 'monospace',
              marginTop: 8,
              animation: 'chatMsgIn 0.2s ease both',
            }}>
              ⚠ {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* ── Suggested Questions Quick Clicks ── */}
        {hasResult && !loading && (
          <div style={{
            padding: '8px 14px',
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            background: COLORS.surface,
            borderTop: `1px solid ${COLORS.border}`,
          }}>
            {[
              typeof result?.next_question === 'string' ? result.next_question : 
                (result?.next_question?.question || result?.next_question?.suggested_question || null),
              "Where is the main conflict?",
              "Which witness is more reliable?",
              "What is uncertain?"
            ].filter(Boolean).slice(0, 3).map((q, idx) => (
              <button
                key={idx}
                onClick={() => { setInput(q); handleSend(q); }}
                style={{
                  whiteSpace: 'nowrap',
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 14,
                  padding: '6px 12px',
                  color: COLORS.accent,
                  fontSize: 11,
                  fontFamily: 'system-ui, sans-serif',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => {
                  e.currentTarget.style.borderColor = COLORS.accent
                  e.currentTarget.style.background = '#1f3a5f'
                }}
                onMouseOut={e => {
                  e.currentTarget.style.borderColor = COLORS.border
                  e.currentTarget.style.background = COLORS.bg
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* ── Input row ── */}
        <div style={{
          padding: '10px 14px',
          borderTop: hasResult ? 'none' : `1px solid ${COLORS.border}`,
          display: 'flex',
          gap: 8,
          background: COLORS.surface,
          flexShrink: 0,
          alignItems: 'flex-end',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasResult
              ? 'Ask about the case evidence... (Enter to send)'
              : 'Run the pipeline first to load case context…'
            }
            disabled={loading}
            rows={1}
            style={{
              flex: 1,
              background: COLORS.inputBg,
              border: `1px solid ${input ? COLORS.accent + '66' : COLORS.border}`,
              borderRadius: 10,
              padding: '10px 13px',
              color: COLORS.text,
              fontSize: 13,
              fontFamily: 'system-ui, sans-serif',
              resize: 'none',
              outline: 'none',
              lineHeight: 1.5,
              maxHeight: 100,
              overflow: 'auto',
              transition: 'border-color 0.2s',
              cursor: loading ? 'not-allowed' : 'text',
            }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? COLORS.inputBg : COLORS.send,
              border: `1px solid ${loading || !input.trim() ? COLORS.border : COLORS.send}`,
              borderRadius: 10,
              padding: '10px 16px',
              color: loading || !input.trim() ? COLORS.muted : '#ffffff',
              fontSize: 13,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s, border-color 0.2s',
              flexShrink: 0,
              fontFamily: 'monospace',
              fontWeight: 600,
            }}
            onMouseOver={e => {
              if (!loading && input.trim())
                e.currentTarget.style.background = COLORS.sendHov
            }}
            onMouseOut={e => {
              if (!loading && input.trim())
                e.currentTarget.style.background = COLORS.send
            }}
            aria-label="Send message"
          >
            {loading ? '…' : '↑'}
          </button>
        </div>
      </div>
    </>
  )
}
