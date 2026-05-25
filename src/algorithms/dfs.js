import { getTrafficMultiplier } from '../data/cityGraph';

const buildAdjacency = (nodes, edges) => {
  const graph = Object.fromEntries(nodes.map((node) => [node.id, []]));
  edges.forEach((edge) => {
    graph[edge.from].push({ node: edge.to, edge });
    graph[edge.to].push({ node: edge.from, edge: { ...edge, from: edge.to, to: edge.from } });
  });
  return graph;
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

export default function dfs(nodes, edges, trafficMultipliers, source, destination) {
  const graph = buildAdjacency(nodes, edges);
  const visited = new Set();
  const steps = [];
  const path = [];
  let found = false;

  const visit = (nodeId) => {
    if (found) return;
    visited.add(nodeId);
    path.push(nodeId);
    steps.push({ type: 'visit', nodeId, currentCost: path.length - 1 });

    if (nodeId === destination) {
      found = true;
      return;
    }

    graph[nodeId].forEach(({ node: neighbor, edge }) => {
      if (found) return;
      steps.push({
        type: 'explore',
        nodeId: neighbor,
        edgeFrom: edge.from,
        edgeTo: edge.to,
        currentCost: path.length,
      });
      if (!visited.has(neighbor)) {
        visit(neighbor);
      }
    });

    if (!found) path.pop();
  };

  visit(source);

  const finalPath = found ? [...path] : [];
  finalPath.forEach((nodeId, index) => {
    steps.push({
      type: 'finalize',
      nodeId,
      edgeFrom: index > 0 ? finalPath[index - 1] : undefined,
      edgeTo: index > 0 ? nodeId : undefined,
      currentCost: index,
    });
  });

  return {
    steps,
    path: finalPath,
    cost: Number(pathCost(finalPath, edges, trafficMultipliers).toFixed(2)),
    nodesVisited: visited.size,
  };
}
