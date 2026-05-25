import { useMemo, useState } from 'react';
import GraphCanvas from '../components/GraphCanvas';
import ControlPanel from '../components/ControlPanel';
import MetricsDashboard from '../components/MetricsDashboard';
import TrafficControls from '../components/TrafficControls';
import useAlgorithmPlayer from '../hooks/useAlgorithmPlayer';
import { NODES, EDGES, edgeKey } from '../data/cityGraph';
import dijkstra from '../algorithms/dijkstra';
import astar from '../algorithms/astar';
import bfs from '../algorithms/bfs';
import dfs from '../algorithms/dfs';
import { playBlock, playNodeVisit, playPathFound, playReset, unlockAudio } from '../components/SoundEngine';

const algorithms = { dijkstra, astar, bfs, dfs };

const runAlgorithm = (algorithm, trafficMultipliers, source, destination) => {
  const started = performance.now();
  const result = algorithms[algorithm](NODES, EDGES, trafficMultipliers, source, destination);
  return { ...result, time: Number((performance.now() - started).toFixed(2)) };
};

const getLiveMetrics = (result, player) => ({
  nodesVisited: new Set(player.visibleSteps.filter((step) => step.type === 'visit').map((step) => step.nodeId)).size,
  cost: player.finished ? result.cost : 0,
  steps: player.cursor,
  time: result.time,
});

export default function HomePage({
  source,
  destination,
  algorithm,
  speed,
  emergencyMode,
  trafficState,
  onSourceChange,
  onDestinationChange,
  onAlgorithmChange,
  onSpeedChange,
  onEmergencyChange,
}) {
  const [trafficOpen, setTrafficOpen] = useState(false);
  const [nextSelection, setNextSelection] = useState('source');
  const effectiveTraffic = useMemo(
    () =>
      emergencyMode
        ? Object.fromEntries(EDGES.map((edge) => [edgeKey(edge.from, edge.to), 1]))
        : trafficState.trafficMultipliers,
    [emergencyMode, trafficState.trafficMultipliers],
  );
  const result = useMemo(
    () => runAlgorithm(algorithm, effectiveTraffic, source, destination),
    [algorithm, effectiveTraffic, source, destination],
  );

  const player = useAlgorithmPlayer(result.steps, speed, {
    onStep: (step) => {
      if (step.type === 'visit') playNodeVisit(NODES.findIndex((node) => node.id === step.nodeId));
      if (step.type === 'explore' && step.currentCost > 16) playBlock();
    },
    onFinish: playPathFound,
  });

  const selectNode = (nodeId) => {
    unlockAudio();
    if (nextSelection === 'source') {
      onSourceChange(nodeId);
      if (nodeId === destination) {
        const fallback = NODES.find((node) => node.id !== nodeId)?.id;
        onDestinationChange(fallback);
      }
      setNextSelection('destination');
    } else {
      if (nodeId !== source) onDestinationChange(nodeId);
      setNextSelection('source');
    }
  };

  const reset = () => {
    player.reset();
    playReset();
  };

  return (
    <div className="grid min-h-[calc(100vh-84px)] gap-4 p-4 lg:grid-cols-[330px_1fr] lg:p-5">
      <div className="order-2 lg:order-1">
        <ControlPanel
          nodes={NODES}
          source={source}
          destination={destination}
          algorithm={algorithm}
          speed={speed}
          isPlaying={player.isPlaying}
          trafficMode={trafficState.trafficMode}
          emergencyMode={emergencyMode}
          onSourceChange={onSourceChange}
          onDestinationChange={onDestinationChange}
          onAlgorithmChange={onAlgorithmChange}
          onSpeedChange={onSpeedChange}
          onPlay={() => {
            unlockAudio();
            player.play();
          }}
          onPause={player.pause}
          onStep={() => {
            unlockAudio();
            player.step();
          }}
          onReset={reset}
          onTrafficModeChange={trafficState.setTrafficMode}
          onEmergencyChange={onEmergencyChange}
        />
      </div>
      <main className="order-1 grid min-h-[560px] gap-4 lg:order-2 lg:grid-rows-[1fr_auto]">
        <GraphCanvas
          nodes={NODES}
          edges={EDGES}
          trafficMultipliers={effectiveTraffic}
          steps={player.visibleSteps}
          source={source}
          destination={destination}
          onNodeSelect={selectNode}
          emergencyMode={emergencyMode}
        />
        <MetricsDashboard
          metrics={getLiveMetrics(result, player)}
          path={player.finished ? result.path : []}
          title={`${algorithm.toUpperCase()} Telemetry`}
        />
      </main>
      <TrafficControls
        edges={EDGES}
        trafficMultipliers={trafficState.trafficMultipliers}
        onTrafficChange={trafficState.setTraffic}
        onRandomize={trafficState.randomizeTraffic}
        onClear={trafficState.clearTraffic}
        open={trafficOpen}
        onToggle={() => setTrafficOpen((open) => !open)}
      />
    </div>
  );
}
