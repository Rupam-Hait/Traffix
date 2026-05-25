import { getTrafficMultiplier } from '../data/cityGraph';

class MinHeap {
  constructor() {
    this.heap = [];
  }

  push(item) {
    this.heap.push(item);
    this.up(this.heap.length - 1);
  }

  pop() {
    if (!this.heap.length) return null;
    const first = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length) {
      this.heap[0] = last;
      this.down(0);
    }
    return first;
  }

  up(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.heap[parent].priority <= this.heap[index].priority) break;
      [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
      index = parent;
    }
  }

  down(index) {
    while (true) {
      let smallest = index;
      const left = index * 2 + 1;
      const right = index * 2 + 2;
      if (left < this.heap.length && this.heap[left].priority < this.heap[smallest].priority) smallest = left;
      if (right < this.heap.length && this.heap[right].priority < this.heap[smallest].priority) smallest = right;
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
    const cost = edge.weight * getTrafficMultiplier(trafficMultipliers, edge.from, edge.to);
    graph[edge.from].push({ node: edge.to, cost, edge });
    graph[edge.to].push({ node: edge.from, cost, edge: { ...edge, from: edge.to, to: edge.from } });
  });
  return graph;
};

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) / 100;

const reconstructPath = (previous, destination) => {
  const path = [];
  let current = destination;
  while (current) {
    path.unshift(current);
    current = previous[current];
  }
  return path;
};

export default function astar(nodes, edges, trafficMultipliers, source, destination) {
  const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const graph = buildAdjacency(nodes, edges, trafficMultipliers);
  const gScore = Object.fromEntries(nodes.map((node) => [node.id, Infinity]));
  const previous = Object.fromEntries(nodes.map((node) => [node.id, null]));
  const queue = new MinHeap();
  const closed = new Set();
  const steps = [];

  gScore[source] = 0;
  queue.push({ node: source, priority: distance(nodeById[source], nodeById[destination]) });

  while (queue.size) {
    const current = queue.pop();
    if (!current || closed.has(current.node)) continue;
    closed.add(current.node);
    steps.push({ type: 'visit', nodeId: current.node, currentCost: gScore[current.node] });
    if (current.node === destination) break;

    graph[current.node].forEach(({ node: neighbor, cost, edge }) => {
      if (closed.has(neighbor)) return;
      const candidate = gScore[current.node] + cost;
      steps.push({
        type: 'explore',
        nodeId: neighbor,
        edgeFrom: edge.from,
        edgeTo: edge.to,
        currentCost: candidate,
      });
      if (candidate < gScore[neighbor]) {
        previous[neighbor] = current.node;
        gScore[neighbor] = candidate;
        queue.push({
          node: neighbor,
          priority: candidate + distance(nodeById[neighbor], nodeById[destination]),
        });
      }
    });
  }

  const path = Number.isFinite(gScore[destination]) ? reconstructPath(previous, destination) : [];
  path.forEach((nodeId, index) => {
    steps.push({
      type: 'finalize',
      nodeId,
      edgeFrom: index > 0 ? path[index - 1] : undefined,
      edgeTo: index > 0 ? nodeId : undefined,
      currentCost: gScore[nodeId],
    });
  });

  return {
    steps,
    path,
    cost: Number.isFinite(gScore[destination]) ? Number(gScore[destination].toFixed(2)) : Infinity,
    nodesVisited: closed.size,
  };
}
