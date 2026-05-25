import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { motion } from 'framer-motion';
import { edgeKey } from '../data/cityGraph';

const trafficColor = d3
  .scaleLinear()
  .domain([1, 2, 3])
  .range(['#00ff88', '#ffcc00', '#ff2d55'])
  .clamp(true);

const normalizeEdgeKey = (from, to) => [from, to].sort().join('-');

const analyzeSteps = (steps) => {
  const visited = new Set();
  const explored = new Set();
  const finalEdges = new Set();
  let currentNode = null;

  steps.forEach((step) => {
    if (step.type === 'visit') {
      visited.add(step.nodeId);
      currentNode = step.nodeId;
    }
    if (step.type === 'explore' && step.edgeFrom && step.edgeTo) {
      explored.add(normalizeEdgeKey(step.edgeFrom, step.edgeTo));
      currentNode = step.nodeId;
    }
    if (step.type === 'finalize') {
      visited.add(step.nodeId);
      currentNode = step.nodeId;
      if (step.edgeFrom && step.edgeTo) {
        finalEdges.add(normalizeEdgeKey(step.edgeFrom, step.edgeTo));
      }
    }
  });

  return { visited, explored, finalEdges, currentNode };
};

export default function GraphCanvas({
  nodes,
  edges,
  trafficMultipliers,
  steps = [],
  source,
  destination,
  onNodeSelect,
  emergencyMode = false,
  compact = false,
  title,
}) {
  const [positions, setPositions] = useState(() =>
    Object.fromEntries(nodes.map((node) => [node.id, { x: node.x, y: node.y }])),
  );
  const simulationRef = useRef(null);
  const stepState = useMemo(() => analyzeSteps(steps), [steps]);
  const nodeById = useMemo(() => Object.fromEntries(nodes.map((node) => [node.id, node])), [nodes]);

  useEffect(() => {
    const simulated = nodes.map((node) => ({ ...node }));
    simulationRef.current = d3
      .forceSimulation(simulated)
      .force('collide', d3.forceCollide(34))
      .force('x', d3.forceX((node) => node.x).strength(0.08))
      .force('y', d3.forceY((node) => node.y).strength(0.08))
      .stop();
    for (let i = 0; i < 16; i += 1) simulationRef.current.tick();
    setPositions(Object.fromEntries(simulated.map((node) => [node.id, { x: node.x, y: node.y }])));
    return () => simulationRef.current?.stop();
  }, [nodes]);

  const handleDrag = (id, info) => {
    setPositions((current) => ({
      ...current,
      [id]: {
        x: Math.max(24, Math.min(776, current[id].x + info.delta.x)),
        y: Math.max(24, Math.min(596, current[id].y + info.delta.y)),
      },
    }));
  };

  return (
    <motion.div
      className="relative h-full min-h-[420px] overflow-hidden rounded-lg border border-glow bg-card shadow-[0_0_35px_rgba(0,245,255,0.08)] backdrop-blur-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {title && (
        <div className="absolute left-4 top-4 z-10 rounded-md border border-glow bg-bg-secondary/80 px-3 py-2 font-display text-xs tracking-[0.2em] text-neon-cyan shadow-neon">
          {title}
        </div>
      )}
      <svg
        viewBox="0 0 800 620"
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full touch-none"
        role="img"
        aria-label="Smart city traffic graph"
      >
        <defs>
          <filter id="cyan-glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="white-glow">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="node-fill">
            <stop offset="0%" stopColor="#12385a" />
            <stop offset="100%" stopColor="#06101f" />
          </radialGradient>
        </defs>

        <g opacity="0.22">
          {Array.from({ length: 13 }).map((_, index) => (
            <line
              key={`grid-v-${index}`}
              x1={index * 70}
              x2={index * 70}
              y1="0"
              y2="620"
              stroke="#00f5ff"
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 10 }).map((_, index) => (
            <line
              key={`grid-h-${index}`}
              x1="0"
              x2="800"
              y1={index * 70}
              y2={index * 70}
              stroke="#bf00ff"
              strokeWidth="0.35"
            />
          ))}
        </g>

        <g>
          {edges.map((edge) => {
            const from = positions[edge.from];
            const to = positions[edge.to];
            const key = edgeKey(edge.from, edge.to);
            const lineLength = Math.hypot(to.x - from.x, to.y - from.y);
            const normalizedKey = normalizeEdgeKey(edge.from, edge.to);
            const isFinal = stepState.finalEdges.has(normalizedKey);
            const isExplored = stepState.explored.has(normalizedKey);
            const traffic = trafficMultipliers[key] ?? 1;
            const stroke = emergencyMode && isFinal ? '#ff2d55' : isFinal ? '#ffffff' : isExplored ? '#bf00ff' : trafficColor(traffic);

            return (
              <g key={key}>
                <motion.line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={stroke}
                  strokeWidth={isFinal ? 7 : Math.max(1.5, edge.weight / 1.8)}
                  strokeLinecap="round"
                  strokeDasharray={isFinal ? lineLength : 0}
                  initial={false}
                  animate={{
                    stroke,
                    opacity: isFinal ? 1 : isExplored ? 0.85 : 0.58,
                    strokeDashoffset: isFinal ? [lineLength, 0] : 0,
                    filter: isFinal
                      ? 'drop-shadow(0 0 14px rgba(255,255,255,0.95))'
                      : isExplored
                        ? 'drop-shadow(0 0 12px rgba(191,0,255,0.7))'
                        : 'drop-shadow(0 0 5px rgba(0,245,255,0.25))',
                  }}
                  transition={{ duration: isFinal ? 0.8 : 0.25, ease: 'easeOut' }}
                />
                {!compact && (
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 7}
                    textAnchor="middle"
                    className="select-none fill-text-primary font-mono text-[11px]"
                  >
                    {(edge.weight * traffic).toFixed(1)}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        <g>
          {nodes.map((node, index) => {
            const pos = positions[node.id];
            const isSource = node.id === source;
            const isDestination = node.id === destination;
            const isVisited = stepState.visited.has(node.id);
            const isCurrent = stepState.currentNode === node.id;
            const fill = isDestination ? '#27123d' : isSource ? '#062c36' : 'url(#node-fill)';
            const ringColor = isSource ? '#00f5ff' : isDestination ? '#bf00ff' : emergencyMode && isCurrent ? '#ff2d55' : '#00f5ff';

            return (
              <motion.g
                key={node.id}
                animate={{ x: pos.x, y: pos.y }}
                drag
                dragMomentum={false}
                dragElastic={0.04}
                onDrag={(_, info) => handleDrag(node.id, info)}
                onClick={() => onNodeSelect?.(node.id)}
                className="cursor-grab active:cursor-grabbing"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
              >
                {(isSource || isDestination || isCurrent) && (
                  <motion.circle
                    r={28}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth="2"
                    animate={{
                      scale: emergencyMode ? [1, 1.24, 1] : [1, 1.12, 1],
                      opacity: [0.6, 1, 0.6],
                      filter: `drop-shadow(0 0 ${emergencyMode ? 24 : 14}px ${ringColor})`,
                    }}
                    transition={{ duration: 1.1, repeat: Infinity }}
                  />
                )}
                <motion.circle
                  r={20}
                  fill={fill}
                  stroke={isVisited ? '#00f5ff' : '#5a7a9a'}
                  strokeWidth="2"
                  filter={isVisited || isCurrent ? 'url(#cyan-glow)' : undefined}
                  animate={
                    isVisited || isCurrent
                      ? {
                          scale: isCurrent ? [1, 1.4, 1] : [1, 1.18, 1],
                          filter: [
                            'drop-shadow(0 0 4px cyan)',
                            'drop-shadow(0 0 20px cyan)',
                            'drop-shadow(0 0 4px cyan)',
                          ],
                        }
                      : { scale: 1 }
                  }
                  transition={{ duration: 0.4 }}
                />
                <text
                  y="5"
                  textAnchor="middle"
                  className="pointer-events-none select-none fill-text-primary font-display text-[15px] font-bold"
                >
                  {node.id}
                </text>
                {!compact && (
                  <text
                    y="38"
                    textAnchor="middle"
                    className="pointer-events-none select-none fill-text-muted font-mono text-[10px]"
                  >
                    {nodeById[node.id].label}
                  </text>
                )}
                <title>{`${node.id} - ${node.label}. Click to select route point.`}</title>
              </motion.g>
            );
          })}
        </g>
      </svg>
    </motion.div>
  );
}
