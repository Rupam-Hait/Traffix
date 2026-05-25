import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import GraphCanvas from './GraphCanvas';
import MetricsDashboard from './MetricsDashboard';
import useAlgorithmPlayer from '../hooks/useAlgorithmPlayer';
import dijkstra from '../algorithms/dijkstra';
import astar from '../algorithms/astar';
import bfs from '../algorithms/bfs';
import dfs from '../algorithms/dfs';
import { playNodeVisit, playPathFound } from './SoundEngine';

const runners = { dijkstra, astar, bfs, dfs };
const names = { dijkstra: 'Dijkstra', astar: 'A*', bfs: 'BFS', dfs: 'DFS' };

const runAlgorithm = (algorithm, nodes, edges, trafficMultipliers, source, destination) => {
  const started = performance.now();
  const result = runners[algorithm](nodes, edges, trafficMultipliers, source, destination);
  return { ...result, time: Number((performance.now() - started).toFixed(2)) };
};

const liveMetrics = (result, player) => ({
  nodesVisited: new Set(player.visibleSteps.filter((step) => step.type === 'visit').map((step) => step.nodeId)).size,
  cost: player.finished ? result.cost : 0,
  steps: player.cursor,
  time: result.time,
});

export default function AlgorithmCompare({ nodes, edges, trafficMultipliers, source, destination, speed, emergencyMode }) {
  const [leftAlgo, setLeftAlgo] = useState('dijkstra');
  const [rightAlgo, setRightAlgo] = useState('astar');
  const effectiveTraffic = emergencyMode
    ? Object.fromEntries(edges.map((edge) => [`${edge.from}-${edge.to}`, 1]))
    : trafficMultipliers;

  const leftResult = useMemo(
    () => runAlgorithm(leftAlgo, nodes, edges, effectiveTraffic, source, destination),
    [leftAlgo, nodes, edges, effectiveTraffic, source, destination],
  );
  const rightResult = useMemo(
    () => runAlgorithm(rightAlgo, nodes, edges, effectiveTraffic, source, destination),
    [rightAlgo, nodes, edges, effectiveTraffic, source, destination],
  );

  const leftPlayer = useAlgorithmPlayer(leftResult.steps, speed, {
    onStep: (step) => step.type === 'visit' && playNodeVisit(nodes.findIndex((node) => node.id === step.nodeId)),
    onFinish: playPathFound,
  });
  const rightPlayer = useAlgorithmPlayer(rightResult.steps, speed, {
    onStep: (step) => step.type === 'visit' && playNodeVisit(nodes.findIndex((node) => node.id === step.nodeId)),
  });

  const bothFinished = leftPlayer.finished && rightPlayer.finished;
  const winner =
    bothFinished &&
    (leftPlayer.cursor === rightPlayer.cursor
      ? 'Tie'
      : leftPlayer.cursor < rightPlayer.cursor
        ? names[leftAlgo]
        : names[rightAlgo]);
  const maxSteps = Math.max(leftResult.steps.length, rightResult.steps.length, 1);

  const playBoth = () => {
    leftPlayer.play();
    rightPlayer.play();
  };

  const resetBoth = () => {
    leftPlayer.reset();
    rightPlayer.reset();
  };

  return (
    <div className="grid h-full gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-glow bg-card p-3 backdrop-blur-2xl">
        <div className="flex flex-wrap gap-2">
          {[leftAlgo, rightAlgo].map((current, index) => (
            <label key={index} className="flex items-center gap-2 font-mono text-xs text-text-muted">
              {index === 0 ? 'Left' : 'Right'}
              <select
                value={current}
                onChange={(event) => (index === 0 ? setLeftAlgo(event.target.value) : setRightAlgo(event.target.value))}
                className="rounded-md border border-glow bg-bg-secondary px-2 py-2 text-text-primary outline-none"
              >
                {Object.entries(names).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <motion.button
            type="button"
            onClick={playBoth}
            className="rounded-md border border-neon-cyan bg-neon-cyan/10 px-4 py-2 font-mono text-xs text-neon-cyan"
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,245,255,0.4)' }}
          >
            Run Comparison
          </motion.button>
          <motion.button
            type="button"
            onClick={resetBoth}
            className="rounded-md border border-glow bg-bg-secondary px-4 py-2 font-mono text-xs text-text-primary"
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,245,255,0.4)' }}
          >
            Reset
          </motion.button>
        </div>
      </div>

      <div className="grid min-h-[430px] gap-4 xl:grid-cols-2">
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          trafficMultipliers={effectiveTraffic}
          steps={leftPlayer.visibleSteps}
          source={source}
          destination={destination}
          emergencyMode={emergencyMode}
          compact
          title={names[leftAlgo]}
        />
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          trafficMultipliers={effectiveTraffic}
          steps={rightPlayer.visibleSteps}
          source={source}
          destination={destination}
          emergencyMode={emergencyMode}
          compact
          title={names[rightAlgo]}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <MetricsDashboard
          title="Comparison Metrics"
          metrics={liveMetrics(leftResult, leftPlayer)}
          path={leftPlayer.finished ? leftResult.path : []}
        />
        <div className="rounded-lg border border-glow bg-card p-4 backdrop-blur-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm uppercase tracking-[0.18em] text-neon-cyan">Real-Time Bars</h2>
            {winner && (
              <motion.span
                className="rounded-md border border-neon-green bg-neon-green/10 px-3 py-1 font-display text-xs text-neon-green"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: [0.4, 1.18, 1] }}
              >
                Winner: {winner}
              </motion.span>
            )}
          </div>
          {[
            { label: names[leftAlgo], value: leftPlayer.cursor, color: '#00f5ff' },
            { label: names[rightAlgo], value: rightPlayer.cursor, color: '#bf00ff' },
          ].map((bar) => (
            <div key={bar.label} className="mb-4">
              <div className="mb-2 flex justify-between font-mono text-xs text-text-muted">
                <span>{bar.label}</span>
                <span>{bar.value} steps</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-bg-secondary">
                <motion.div
                  className="h-full rounded-full"
                  animate={{ width: `${Math.min(100, (bar.value / maxSteps) * 100)}%`, backgroundColor: bar.color }}
                  transition={{ duration: 0.25 }}
                  style={{ boxShadow: `0 0 18px ${bar.color}` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
