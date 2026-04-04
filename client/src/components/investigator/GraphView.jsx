/**
 * GraphView.jsx
 * GitHub commit graph-style testimony divergence visualization.
 * Dark theme, animated nodes, horizontal conflict connectors, hover tooltips.
 */

import { useMemo, useState, useRef, useEffect } from 'react'

// ── Constants ─────────────────────────────────────────────────────────────────
const COLORS = {
  bg:       '#0d1117',
  card:     '#161b22',
  border:   '#30363d',
  certain:  '#58a6ff',
  probable: '#e3b341',
  uncertain:'#8b949e',
  conflict: '#ff7b72',
  text:     '#c9d1d9',
  muted:    '#8b949e',
}

const BRANCH_PALETTE = [
  '#58a6ff', '#3fb950', '#f0883e', '#d2a8ff',
  '#79c0ff', '#56d364', '#ffa657', '#b083f0',
]

const NODE_SIZE  = 10
const ROW_HEIGHT = 72
const COL_WIDTH  = 220
const PADDING    = 32

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildColumns(result, testimonies) {
  const byWitness = {}

  const allEvents = [
    ...(result?.timeline?.confirmed_sequence ?? []).map(e => ({ ...e, _tier: 'certain' })),
    ...(result?.timeline?.probable_sequence  ?? []).map(e => ({ ...e, _tier: 'probable' })),
    ...(result?.timeline?.uncertain_events   ?? []).map(e => ({ ...e, _tier: 'uncertain' })),
    ...(result?.events                       ?? []),
  ]

  allEvents.forEach((ev) => {
    const wid = ev.witness_id ?? ev.source ?? 'Unknown'
    if (!byWitness[wid]) byWitness[wid] = []
    byWitness[wid].push(ev)
  })

  if (Object.keys(byWitness).length === 0 && testimonies?.length) {
    testimonies.forEach((t) => {
      byWitness[t.witness_id] = [{
        description: t.text?.slice(0, 100) ?? '(testimony)',
        time_reference: null,
        _tier: 'certain',
      }]
    })
  }

  return byWitness
}

function buildConflictPairs(conflicts) {
  const pairs = []
  const list = conflicts?.conflicts ?? []
  list.forEach((c) => {
    if (c.witnesses?.length >= 2) {
      pairs.push({
        wA: c.witnesses[0],
        wB: c.witnesses[1],
        description: c.description ?? c.type ?? 'Conflict',
      })
    }
  })
  return pairs
}

function nodeColor(ev, isConflict) {
  if (isConflict) return COLORS.conflict
  const tier = ev._tier ?? ev.placement_confidence
  if (tier === 'certain' || tier === 'confirmed')   return COLORS.certain
  if (tier === 'probable')                           return COLORS.probable
  return COLORS.uncertain
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function Tooltip({ visible, x, y, event, branchColor }) {
  if (!visible) return null
  const tier = event?._tier ?? event?.placement_confidence ?? 'uncertain'

  return (
    <div
      style={{
        position: 'fixed',
        left: x + 14,
        top: y - 10,
        zIndex: 1000,
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: '10px 13px',
        maxWidth: 260,
        pointerEvents: 'none',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        animation: 'tooltipIn 0.12s ease',
      }}
    >
      {event?.time_reference && (
        <p style={{ color: COLORS.muted, fontSize: 10, fontFamily: 'monospace', marginBottom: 4 }}>
          ⏱ {event.time_reference}
        </p>
      )}
      <p style={{ color: COLORS.text, fontSize: 12, margin: 0, lineHeight: 1.55 }}>
        {event?.description ?? '(event)'}
      </p>
      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: branchColor }} />
        <span style={{ color: COLORS.muted, fontSize: 10, fontFamily: 'monospace', textTransform: 'capitalize' }}>
          {tier}
        </span>
      </div>
    </div>
  )
}

// ── EventNode ─────────────────────────────────────────────────────────────────

function EventNode({ event, color, isConflict, onMouseEnter, onMouseLeave, rowIndex }) {
  const dot = nodeColor(event, isConflict)
  const glow = isConflict
    ? `0 0 0 3px ${COLORS.conflict}33, 0 0 12px ${COLORS.conflict}55`
    : `0 0 0 3px ${color}22`

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        animation: `nodeIn 0.35s ease ${rowIndex * 0.06}s both`,
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Dot */}
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          width: NODE_SIZE,
          height: NODE_SIZE,
          borderRadius: '50%',
          background: dot,
          flexShrink: 0,
          marginTop: 4,
          cursor: 'default',
          transition: 'box-shadow 0.2s, transform 0.2s',
          boxShadow: `0 0 0 2px #0d1117, 0 0 0 3px ${dot}88`,
        }}
        onMouseOver={e => {
          e.currentTarget.style.boxShadow = glow
          e.currentTarget.style.transform = 'scale(1.35)'
        }}
        onMouseOut={e => {
          e.currentTarget.style.boxShadow = `0 0 0 2px #0d1117, 0 0 0 3px ${dot}88`
          e.currentTarget.style.transform = 'scale(1)'
        }}
      />

      {/* Card */}
      <div
        style={{
          background: COLORS.card,
          border: `1px solid ${isConflict ? COLORS.conflict + '55' : COLORS.border}`,
          borderRadius: 6,
          padding: '6px 10px',
          flex: 1,
          fontSize: 11,
          color: COLORS.text,
          lineHeight: 1.5,
          wordBreak: 'break-word',
          maxHeight: 56,
          overflow: 'hidden',
          transition: 'box-shadow 0.2s, border-color 0.2s',
          cursor: 'default',
        }}
        onMouseOver={e => {
          e.currentTarget.style.boxShadow = `0 0 0 1px ${isConflict ? COLORS.conflict : color}55, 0 4px 16px ${isConflict ? COLORS.conflict : color}22`
          e.currentTarget.style.borderColor = isConflict ? COLORS.conflict + 'aa' : color + '66'
        }}
        onMouseOut={e => {
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.borderColor = isConflict ? COLORS.conflict + '55' : COLORS.border
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {event.description ?? event.text ?? '(event)'}
        {event.time_reference && (
          <p style={{ color: COLORS.muted, fontSize: 10, margin: '3px 0 0', fontFamily: 'monospace' }}>
            ⏱ {event.time_reference}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  const items = [
    { color: COLORS.certain,  label: 'Certain'   },
    { color: COLORS.probable, label: 'Probable'  },
    { color: COLORS.uncertain,label: 'Uncertain' },
    { color: COLORS.conflict, label: 'Conflict'  },
  ]
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      {items.map(({ color, label }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: color,
            boxShadow: `0 0 5px ${color}88`,
          }} />
          <span style={{ color: COLORS.muted, fontSize: 11, fontFamily: 'monospace' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

// ── ConflictBadge ─────────────────────────────────────────────────────────────

function ConflictBadge({ wA, wB, description }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      background: '#2d1117',
      border: `1px solid ${COLORS.conflict}44`,
      borderRadius: 20,
      padding: '3px 11px',
      fontSize: 11,
      fontFamily: 'monospace',
      color: COLORS.conflict,
    }}>
      <span style={{ fontSize: 10 }}>⚡</span>
      {wA} ↔ {wB}
      {description && <span style={{ color: COLORS.muted, fontSize: 10 }}> · {description}</span>}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function GraphView({ result, testimonies }) {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, event: null, color: '#58a6ff' })

  const byWitness    = useMemo(() => buildColumns(result, testimonies), [result, testimonies])
  const conflictPairs = useMemo(() => buildConflictPairs(result?.conflicts), [result])
  const witnessIds   = Object.keys(byWitness)

  const conflictedWitnesses = useMemo(() => {
    const s = new Set()
    conflictPairs.forEach(({ wA, wB }) => { s.add(wA); s.add(wB) })
    return s
  }, [conflictPairs])

  const handleMouseEnter = (e, event, color) => {
    setTooltip({ visible: true, x: e.clientX, y: e.clientY, event, color })
  }
  const handleMouseMove  = (e) => {
    if (tooltip.visible) setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))
  }
  const handleMouseLeave = () => setTooltip(t => ({ ...t, visible: false }))

  if (witnessIds.length === 0) {
    return (
      <div style={{
        background: COLORS.bg,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 40,
        textAlign: 'center',
        color: COLORS.muted,
        fontFamily: 'monospace',
        fontSize: 13,
      }}>
        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>⑂</div>
        No testimony data yet. Run the pipeline first.
      </div>
    )
  }

  return (
    <>
      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes nodeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes tooltipIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes lineGrow {
          from { scaleY: 0; }
          to   { scaleY: 1; }
        }
      `}</style>

      <Tooltip
        visible={tooltip.visible}
        x={tooltip.x}
        y={tooltip.y}
        event={tooltip.event}
        branchColor={tooltip.color}
      />

      <div
        style={{
          background: COLORS.bg,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          overflow: 'hidden',
          fontFamily: 'system-ui, sans-serif',
        }}
        onMouseMove={handleMouseMove}
      >
        {/* ── Title bar ── */}
        <div style={{
          padding: '14px 20px',
          borderBottom: `1px solid ${COLORS.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
          background: '#0d1117',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#f0f6fc', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
              ⑂ Testimony Divergence Graph
            </h2>
            <p style={{ margin: '3px 0 0', color: COLORS.muted, fontSize: 11, fontFamily: 'monospace' }}>
              {witnessIds.length} witness{witnessIds.length !== 1 ? 'es' : ''} · {conflictPairs.length} conflict{conflictPairs.length !== 1 ? 's' : ''} detected
            </p>
          </div>
          <Legend />
        </div>

        {/* ── Conflict badges ── */}
        {conflictPairs.length > 0 && (
          <div style={{
            padding: '8px 20px',
            background: '#1a0a0a',
            borderBottom: `1px solid ${COLORS.border}`,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
          }}>
            {conflictPairs.map(({ wA, wB, description }, i) => (
              <ConflictBadge key={i} wA={wA} wB={wB} description={description} />
            ))}
          </div>
        )}

        {/* ── Graph area ── */}
        <div style={{ overflowX: 'auto', padding: `${PADDING}px` }}>
          {/* Column headers */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, minWidth: witnessIds.length * COL_WIDTH }}>
            {witnessIds.map((wid, colIdx) => {
              const color = BRANCH_PALETTE[colIdx % BRANCH_PALETTE.length]
              const hasConflict = conflictedWitnesses.has(wid)
              return (
                <div key={wid} style={{ width: COL_WIDTH, display: 'flex', justifyContent: 'center' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: hasConflict ? '#1a0808' : '#161b22',
                    border: `1px solid ${hasConflict ? COLORS.conflict + '88' : color + '66'}`,
                    borderRadius: 20,
                    padding: '4px 14px',
                    animation: `nodeIn 0.3s ease ${colIdx * 0.08}s both`,
                  }}>
                    {/* Branch icon line */}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasConflict ? COLORS.conflict : color, boxShadow: `0 0 6px ${hasConflict ? COLORS.conflict : color}88` }} />
                    <span style={{ color: hasConflict ? COLORS.conflict : color, fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>
                      {wid}
                    </span>
                    {hasConflict && <span style={{ color: COLORS.conflict, fontSize: 10 }}>⚡</span>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Columns with timeline lines + nodes */}
          <div style={{ display: 'flex', gap: 0, minWidth: witnessIds.length * COL_WIDTH, position: 'relative' }}>
            {/* Horizontal conflict connectors drawn as absolute overlay */}
            {conflictPairs.map(({ wA, wB }, i) => {
              const idxA = witnessIds.indexOf(wA)
              const idxB = witnessIds.indexOf(wB)
              if (idxA === -1 || idxB === -1) return null
              const left  = Math.min(idxA, idxB) * COL_WIDTH + COL_WIDTH / 2
              const right = Math.max(idxA, idxB) * COL_WIDTH + COL_WIDTH / 2
              const top   = ROW_HEIGHT * 0.5 + 20 // roughly first node row

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: top,
                    left: left,
                    width: right - left,
                    height: 2,
                    background: `linear-gradient(to right, ${COLORS.conflict}00, ${COLORS.conflict}cc, ${COLORS.conflict}00)`,
                    zIndex: 0,
                    pointerEvents: 'none',
                    animation: `nodeIn 0.4s ease 0.2s both`,
                  }}
                />
              )
            })}

            {witnessIds.map((wid, colIdx) => {
              const color = BRANCH_PALETTE[colIdx % BRANCH_PALETTE.length]
              const events = byWitness[wid]

              return (
                <div
                  key={wid}
                  style={{
                    width: COL_WIDTH,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                >
                  {/* Vertical timeline stem */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 2,
                      background: `linear-gradient(to bottom, ${color}cc 0%, ${color}33 80%, transparent 100%)`,
                      zIndex: 0,
                      animation: `nodeIn 0.5s ease ${colIdx * 0.05}s both`,
                    }}
                  />

                  {/* Nodes */}
                  <div style={{ position: 'relative', zIndex: 1, width: '100%', padding: '0 12px', boxSizing: 'border-box' }}>
                    {events.map((ev, rowIdx) => (
                      <div key={rowIdx} style={{ marginBottom: ROW_HEIGHT - 30 }}>
                        <EventNode
                          event={ev}
                          color={color}
                          isConflict={conflictedWitnesses.has(wid) && rowIdx === 0}
                          rowIndex={colIdx * events.length + rowIdx}
                          onMouseEnter={e => handleMouseEnter(e, ev, color)}
                          onMouseLeave={handleMouseLeave}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
