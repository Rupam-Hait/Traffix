import AlgorithmCompare from '../components/AlgorithmCompare';
import { NODES, EDGES } from '../data/cityGraph';

export default function ComparePage({ source, destination, speed, emergencyMode, trafficState }) {
  return (
    <main className="min-h-[calc(100vh-84px)] p-4 lg:p-5">
      <AlgorithmCompare
        nodes={NODES}
        edges={EDGES}
        trafficMultipliers={trafficState.trafficMultipliers}
        source={source}
        destination={destination}
        speed={speed}
        emergencyMode={emergencyMode}
      />
    </main>
  );
}
