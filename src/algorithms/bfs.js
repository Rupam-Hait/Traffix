import { getTrafficMultiplier } from '../data/cityGraph';

const buildAdjacency = (nodes, edges) => {
  const graph = Object.fromEntries(nodes.map((node) => [node.id, []]));
  edges.forEach((edge) => {
    graph[edge.from].push({ node: edge.to, edge });
    graph[edge.to].push({ node: edge.from, edge: { ...edge, from: edge.to, to: edge.from } });
  });
  return graph;
};

const reconstructPath = (previous, destination) => {
  const path = [];
  let current = destination;
  while (current) {
    path.unshift(current);
    current = previous[current];
  }
  return path;
};

const pathCost = (path, edges, trafficMultipliers) =>
  path.slice(1).reduce((total, nodeId, index) => {
    const from = path[index];
    const edge = edges.find(
      (candidate) =>
        (candidate.from === from && candidate.to === nodeId) ||
        (candidate.from === nodeId && candidate.to === from),
    );
    return edge ? total + edge.weight * getTrafficMultiplier(trafficMultipliers, edge.from, edge.to) : total;
  }, 0);

export default function bfs(nodes, edges, trafficMultipliers, source, destination) {
  const graph = buildAdjacency(nodes, edges);
  const queue = [source];
  const visited = new Set([source]);
  const previous = Object.fromEntries(nodes.map((node) => [node.id, null]));
  const steps = [];

  while (queue.length) {
    const current = queue.shift();
    steps.push({ type: 'visit', nodeId: current, currentCost: queue.length });
    if (current === destination) break;

    graph[current].forEach(({ node: neighbor, edge }) => {
      steps.push({
        type: 'explore',
        nodeId: neighbor,
        edgeFrom: edge.from,
        edgeTo: edge.to,
        currentCost: queue.length,
      });
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        previous[neighbor] = current;
        queue.push(neighbor);
      }
    });
  }

  const path = visited.has(destination) ? reconstructPath(previous, destination) : [];
  path.forEach((nodeId, index) => {
    steps.push({
      type: 'finalize',
      nodeId,
      edgeFrom: index > 0 ? path[index - 1] : undefined,
      edgeTo: index > 0 ? nodeId : undefined,
      currentCost: index,
    });
  });

  return {
    steps,
    path,
    cost: Number(pathCost(path, edges, trafficMultipliers).toFixed(2)),
    nodesVisited: visited.size,
  };
}
