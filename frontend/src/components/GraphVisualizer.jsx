import { useEffect, useRef, useState } from 'react'

const VIZ_TYPES = ['graph', 'tree', 'linked_list']

export default function GraphVisualizer({ data }) {
    const [visited, setVisited] = useState([])
    const [current, setCurrent] = useState(null)
    const [running, setRunning] = useState(false)
    const intervalRef = useRef(null)

    // Don't render if no valid viz data from Gemini
    if (!data || !data.nodes?.length || !data.edges?.length) return null

    const { type, nodes, edges, traversal_order = nodes, highlight = [] } = data
    const typeLabel = type === 'linked_list' ? 'LINKED LIST' : type === 'tree' ? 'TREE' : 'GRAPH'

    const runAnimation = () => {
        if (running) return
        clearInterval(intervalRef.current)
        setRunning(true)
        setVisited([])
        setCurrent(null)

        let step = 0
        const order = traversal_order.length ? traversal_order : nodes
        intervalRef.current = setInterval(() => {
            if (step >= order.length) {
                clearInterval(intervalRef.current)
                setCurrent(null)
                setRunning(false)
                return
            }
            setCurrent(order[step])
            setVisited(prev => [...prev, order[step]])
            step++
        }, 600)
    }

    useEffect(() => {
        runAnimation()
        return () => clearInterval(intervalRef.current)
    }, [JSON.stringify(data)])

    // ── Layout: position nodes in a balanced layout ──────────────────────────
    const getPositions = () => {
        const n = nodes.length
        const W = 300, H = 220, cx = W / 2, cy = H / 2

        if (type === 'linked_list') {
            // linear left-to-right
            const spacing = Math.min(60, (W - 40) / Math.max(n - 1, 1))
            const startX = (W - spacing * (n - 1)) / 2
            return Object.fromEntries(nodes.map((id, i) => [id, { x: startX + i * spacing, y: cy }]))
        }

        if (type === 'tree') {
            // BFS layout — assign levels then spread evenly per level
            const levels = {}
            const adj = {}
            nodes.forEach(id => { adj[id] = [] })
            edges.forEach(([s, t]) => { adj[s]?.push(t) })

            // BFS from node 0 (or first node)
            const root = nodes[0]
            const queue = [root]
            const levelOf = { [root]: 0 }
            while (queue.length) {
                const node = queue.shift()
                const lvl = levelOf[node]
                if (!levels[lvl]) levels[lvl] = []
                levels[lvl].push(node)
                for (const child of adj[node]) {
                    if (levelOf[child] === undefined) {
                        levelOf[child] = lvl + 1
                        queue.push(child)
                    }
                }
            }
            const totalLevels = Object.keys(levels).length
            const levelH = H / (totalLevels + 1)
            const positions = {}
            Object.entries(levels).forEach(([lvl, lvlNodes]) => {
                const y = (parseInt(lvl) + 1) * levelH
                const spacing = W / (lvlNodes.length + 1)
                lvlNodes.forEach((id, i) => {
                    positions[id] = { x: (i + 1) * spacing, y }
                })
            })
            return positions
        }

        // Default: circular layout
        return Object.fromEntries(
            nodes.map((id, i) => {
                const angle = (2 * Math.PI * i) / n - Math.PI / 2
                const r = Math.min(cx - 30, cy - 30)
                return [id, { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }]
            })
        )
    }

    const positions = getPositions()

    const getNodeFill = (id) => {
        if (id === current) return '#6ee7b7' // active — bright green
        if (highlight.includes(id)) return '#ef4444' // highlighted bug node — red
        if (visited.includes(id)) return '#2563eb' // visited — blue
        return '#27272a'                               // unvisited
    }

    const getEdgeColor = (s, t) =>
        visited.includes(s) && visited.includes(t) ? '#3b82f6' : '#3f3f46'

    return (
        <div style={{
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginTop: '16px',
            background: '#0a0a0a',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}>
                <span style={{ fontSize: '11px', color: '#71717a', letterSpacing: '0.1em', fontWeight: 500 }}>
                    {typeLabel} VISUALIZATION
                    {highlight.length > 0 && (
                        <span style={{ color: '#ef4444', marginLeft: '8px' }}>
                            · red = bug-related node{highlight.length > 1 ? 's' : ''}
                        </span>
                    )}
                </span>
                <button
                    onClick={runAnimation}
                    disabled={running}
                    style={{
                        fontSize: '11px', color: running ? '#52525b' : '#a1a1aa',
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '6px', padding: '3px 10px', cursor: running ? 'not-allowed' : 'pointer',
                    }}
                >
                    {running ? 'Running…' : '▶ Replay'}
                </button>
            </div>

            {/* SVG */}
            <svg width="300" height="230" style={{ display: 'block', margin: '0 auto' }}>
                {/* Edges */}
                {edges.map(([s, t], i) => {
                    const sp = positions[s], tp = positions[t]
                    if (!sp || !tp) return null
                    return (
                        <line key={i}
                            x1={sp.x} y1={sp.y} x2={tp.x} y2={tp.y}
                            stroke={getEdgeColor(s, t)} strokeWidth={1.5}
                            style={{ transition: 'stroke 0.4s ease' }}
                        />
                    )
                })}

                {/* Arrow heads for linked list / tree */}
                {(type === 'linked_list' || type === 'tree') && edges.map(([s, t], i) => {
                    const sp = positions[s], tp = positions[t]
                    if (!sp || !tp) return null
                    const angle = Math.atan2(tp.y - sp.y, tp.x - sp.x)
                    const r = 18
                    const ax = tp.x - r * Math.cos(angle)
                    const ay = tp.y - r * Math.sin(angle)
                    return (
                        <polygon key={`arrow-${i}`}
                            points={`${ax},${ay} ${ax - 8 * Math.cos(angle - 0.4)},${ay - 8 * Math.sin(angle - 0.4)} ${ax - 8 * Math.cos(angle + 0.4)},${ay - 8 * Math.sin(angle + 0.4)}`}
                            fill={getEdgeColor(s, t)}
                            style={{ transition: 'fill 0.4s ease' }}
                        />
                    )
                })}

                {/* Nodes */}
                {nodes.map(id => {
                    const pos = positions[id]
                    if (!pos) return null
                    const fill = getNodeFill(id)
                    const isActive = id === current
                    return (
                        <g key={id}>
                            <circle
                                cx={pos.x} cy={pos.y} r={16}
                                fill={fill}
                                stroke={isActive ? '#6ee7b7' : 'rgba(255,255,255,0.1)'}
                                strokeWidth={isActive ? 2.5 : 1}
                                style={{ transition: 'fill 0.3s ease, stroke 0.3s ease' }}
                            />
                            <text
                                x={pos.x} y={pos.y + 4}
                                textAnchor="middle"
                                fill={isActive ? '#000' : '#e4e4e7'}
                                fontSize="12" fontWeight="600"
                                style={{ fontFamily: 'monospace', userSelect: 'none' }}
                            >
                                {id}
                            </text>
                        </g>
                    )
                })}
            </svg>

            {/* Traversal order display */}
            <div style={{
                padding: '6px 14px 10px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap',
            }}>
                <span style={{ fontSize: '11px', color: '#52525b' }}>Visit order:</span>
                {visited.map((id, i) => (
                    <span key={i} style={{
                        fontSize: '11px', fontWeight: 600,
                        color: highlight.includes(id) ? '#ef4444' : id === current ? '#6ee7b7' : '#3b82f6',
                        fontFamily: 'monospace',
                    }}>
                        {id}{i < visited.length - 1 ? ' →' : ''}
                    </span>
                ))}
                {visited.length === 0 && (
                    <span style={{ fontSize: '11px', color: '#3f3f46' }}>starting…</span>
                )}
            </div>
        </div>
    )
}
