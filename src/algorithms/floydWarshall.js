import { getTrafficMultiplier } from '../data/cityGraph';

export default function floydWarshall(nodes, edges, trafficMultipliers = {}) {
  const ids = nodes.map((node) => node.id);
  const indexById = Object.fromEntries(ids.map((id, index) => [id, index]));
  const size = nodes.length;
  const dist = Array.from({ length: size }, () => Array(size).fill(Infinity));
  const next = Array.from({ length: size }, () => Array(size).fill(null));
  const steps = [];

  for (let i = 0; i < size; i += 1) {
    dist[i][i] = 0;
    next[i][i] = ids[i];
  }

  edges.forEach((edge) => {
    const from = indexById[edge.from];
    const to = indexById[edge.to];
    const cost = edge.weight * getTrafficMultiplier(trafficMultipliers, edge.from, edge.to);
    dist[from][to] = cost;
    dist[to][from] = cost;
    next[from][to] = edge.to;
    next[to][from] = edge.from;
  });

  for (let k = 0; k < size; k += 1) {
    steps.push({ type: 'visit', nodeId: ids[k], currentCost: 0 });
    for (let i = 0; i < size; i += 1) {
      for (let j = 0; j < size; j += 1) {
        const candidate = dist[i][k] + dist[k][j];
        if (candidate < dist[i][j]) {
          dist[i][j] = candidate;
          next[i][j] = next[i][k];
          steps.push({
            type: 'explore',
            nodeId: ids[j],
            edgeFrom: ids[i],
            edgeTo: ids[j],
            currentCost: candidate,
          });
        }
      }
    }
  }

  return {
    matrix: dist.map((row) => row.map((value) => (Number.isFinite(value) ? Number(value.toFixed(2)) : Infinity))),
    next,
    labels: ids,
    steps,
    path: [],
    cost: 0,
    nodesVisited: size,
  };
}
