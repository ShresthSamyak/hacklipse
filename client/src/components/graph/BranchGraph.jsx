import { useRef, useState } from 'react'

const nodes = [
  { cx: 50,  cy: 300, r: 12, type: 'main',     info: 'Initial State: Incident Zero',              label: 'v1.0',         labelY: 330 },
  { cx: 200, cy: 300, r: 12, type: 'main',     info: 'Divergence Point: The Flash' },
  { cx: 350, cy: 300, r: 12, type: 'main',     info: 'Secondary Fracture' },
  { cx: 500, cy: 300, r: 12, type: 'main',     info: 'Mainline Anchor' },
  { cx: 800, cy: 300, r: 12, type: 'resolved', info: 'Resolution: Unified Timeline',              label: 'v2.0-merged', labelY: 330 },
  { cx: 950, cy: 300, r: 12, type: 'main',     info: 'Current State' },

  { cx: 300, cy: 150, r: 10, type: 'branchA',  info: 'Alpha: City Evacuation' },
  { cx: 450, cy: 150, r: 10, type: 'branchA',  info: 'Alpha: Quarantine Zone Established' },
  { cx: 600, cy: 150, r: 10, type: 'branchA',  info: 'Alpha: Attempted Merge' },
  { cx: 550, cy: 50,  r: 8,  type: 'branchA',  info: 'Alpha: Dead End Reality', opacity: 0.5 },

  { cx: 450, cy: 450, r: 10, type: 'branchB',  info: 'Beta: Complete Containment Failure' },
  { cx: 600, cy: 450, r: 10, type: 'branchB',  info: 'Beta: Rogue Faction Control' },

  { cx: 700, cy: 300, r: 16, type: 'conflict', info: 'MERGE CONFLICT: Alpha vs Beta memory overlap detected. Awaiting investigator resolution.',
    label: '! CONFLICT', labelY: 340 },
]

const nodeFill = {
  main:     '#6366f1',
  resolved: '#6366f1',
  branchA:  '#ef4444',
  branchB:  '#10b981',
  conflict: '#f59e0b',
}

const nodeTitleColor = {
  main:     '#6366f1',
  resolved: '#10b981',
  branchA:  '#ef4444',
  branchB:  '#10b981',
  conflict: '#f59e0b',
}

const nodeTitleLabel = {
  main:     'Mainline Node',
  resolved: 'Resolved Node',
  branchA:  'Branch Alpha',
  branchB:  'Branch Beta',
  conflict: 'MERGE CONFLICT',
}

export default function BranchGraph() {
  const containerRef = useRef(null)
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, title: '', info: '', color: '#6366f1' })

  const handleMouseMove = (e, node) => {
    const rect = containerRef.current.getBoundingClientRect()
    setTooltip({
      visible: true,
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top + 15,
      title: nodeTitleLabel[node.type],
      info: node.info,
      color: nodeTitleColor[node.type],
    })
  }

  const handleMouseLeave = () => {
    setTooltip((t) => ({ ...t, visible: false }))
  }

  return (
    <div className="flex-grow relative overflow-hidden bg-[#1e293b]/30" ref={containerRef}>
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        aria-hidden="true"
      />

      {/* SVG Graph */}
      <svg
        className="w-full h-full absolute inset-0"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid meet"
        aria-label="Narrative branch graph"
        role="img"
      >
        {/* Edges */}
        {/* Mainline */}
        <path d="M 50 300 L 200 300 L 350 300 L 500 300 L 650 300 L 800 300 L 950 300"
          stroke="#6366f1" strokeWidth={3} fill="none" opacity={0.6} />
        {/* Alpha Branch */}
        <path d="M 200 300 C 250 300, 250 150, 300 150 L 450 150 L 600 150 C 650 150, 650 300, 700 300"
          stroke="#ef4444" strokeWidth={3} fill="none" opacity={0.6} />
        <path d="M 450 150 L 550 50"
          stroke="#ef4444" strokeWidth={3} fill="none" opacity={0.6} strokeDasharray="5,5" />
        {/* Beta Branch */}
        <path d="M 350 300 C 400 300, 400 450, 450 450 L 600 450 C 650 450, 650 300, 700 300"
          stroke="#10b981" strokeWidth={3} fill="none" opacity={0.6} />

        {/* Nodes */}
        {nodes.map((node, idx) => (
          <g key={idx}>
            <circle
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill={nodeFill[node.type]}
              opacity={node.opacity ?? 1}
              stroke={node.type === 'conflict' ? '#fff' : node.type === 'resolved' ? '#10b981' : undefined}
              strokeWidth={node.type === 'conflict' || node.type === 'resolved' ? 2 : undefined}
              className="graph-node"
              onMouseMove={(e) => handleMouseMove(e, node)}
              onMouseLeave={handleMouseLeave}
              tabIndex={0}
              role="button"
              aria-label={node.info}
              onFocus={(e) => handleMouseMove(e, node)}
              onBlur={handleMouseLeave}
            />
            {node.label && (
              <text
                x={node.cx}
                y={node.labelY}
                fill={node.type === 'conflict' ? '#f59e0b' : node.type === 'resolved' ? '#10b981' : '#f8fafc'}
                fontFamily="Fira Code"
                fontSize={12}
                fontWeight={node.type === 'conflict' ? 'bold' : 'normal'}
                textAnchor="middle"
              >
                {node.label}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="absolute pointer-events-none bg-[#1e293b] border border-[#334155] rounded-lg p-3 z-20 shadow-xl max-w-[250px]"
          style={{ left: tooltip.x, top: tooltip.y }}
          role="tooltip"
        >
          <p className="font-mono-code text-xs mb-1" style={{ color: tooltip.color }}>
            {tooltip.title}
          </p>
          <p className="text-sm text-[#f8fafc]">{tooltip.info}</p>
        </div>
      )}
    </div>
  )
}
