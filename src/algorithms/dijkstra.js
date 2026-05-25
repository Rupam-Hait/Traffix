import { edgeKey, getTrafficMultiplier } from '../data/cityGraph';

class MinHeap {
  constructor() {
    this.heap = [];
  }

  push(item) {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return min;
  }

  bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.heap[parent].priority <= this.heap[index].priority) break;
      [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
      index = parent;
    }
  }

  sinkDown(index) {
    while (true) {
      const left = index * 2 + 1;
      const right = index * 2 + 2;
      let smallest = index;
      if (left < this.heap.length && this.heap[left].priority < this.heap[smallest].priority) {
        smallest = left;
      }
      if (right < this.heap.length && this.heap[right].priority < this.heap[smallest].priority) {
        smallest = right;
      }
      if (smallest === index) break;
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      index = smallest;
    }
  }

  get size() {
    return this.heap.length;
  }
}

const buildAdjacency = (nodes, edges, trafficMultipliers) => {
  const graph = Object.fromEntries(nodes.map((node) => [node.id, []]));
  edges.forEach((edge) => {
    const multiplier = getTrafficMultiplier(trafficMultipliers, edge.from, edge.to);
    const cost = edge.weight * multiplier;
    graph[edge.from].push({ node: edge.to, cost, edge });
    graph[edge.to].push({ node: edge.from, cost, edge: { ...edge, from: edge.to, to: edge.from } });
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

export default function dijkstra(nodes, edges, trafficMultipliers, source, destination) {
  const graph = buildAdjacency(nodes, edges, trafficMultipliers);
  const distances = Object.fromEntries(nodes.map((node) => [node.id, Infinity]));
  const previous = Object.fromEntries(nodes.map((node) => [node.id, null]));
  const visited = new Set();
  const steps = [];
  const queue = new MinHeap();

  distances[source] = 0;
  queue.push({ node: source, priority: 0 });

  while (queue.size) {
    const current = queue.pop();
    if (!current || visited.has(current.node)) continue;
    visited.add(current.node);
    steps.push({ type: 'visit', nodeId: current.node, currentCost: distances[current.node] });

    if (current.node === destination) break;

    graph[current.node].forEach(({ node: neighbor, cost, edge }) => {
      if (visited.has(neighbor)) return;
      steps.push({
        type: 'explore',
        nodeId: neighbor,
        edgeFrom: edge.from,
        edgeTo: edge.to,
        currentCost: distances[current.node] + cost,
      });
      const candidate = distances[current.node] + cost;
      if (candidate < distances[neighbor]) {
        distances[neighbor] = candidate;
        previous[neighbor] = current.node;
        queue.push({ node: neighbor, priority: candidate });
      }
    });
  }

  const path = Number.isFinite(distances[destination]) ? reconstructPath(previous, destination) : [];
  path.forEach((nodeId, index) => {
    steps.push({
      type: 'finalize',
      nodeId,
      edgeFrom: index > 0 ? path[index - 1] : undefined,
      edgeTo: index > 0 ? nodeId : undefined,
      currentCost: distances[nodeId],
    });
  });

  return {
    steps,
    path,
    cost: Number.isFinite(distances[destination]) ? Number(distances[destination].toFixed(2)) : Infinity,
    nodesVisited: visited.size,
    edgeKey,
  };
}
