class MinHeap {
  constructor() {
    this.items = [];
  }

  push(value) {
    this.items.push(value);
    this.bubbleUp(this.items.length - 1);
  }

  pop() {
    if (!this.items.length) return null;
    const min = this.items[0];
    const last = this.items.pop();

    if (this.items.length) {
      this.items[0] = last;
      this.sinkDown(0);
    }

    return min;
  }

  bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.items[parent].priority <= this.items[index].priority) break;
      [this.items[parent], this.items[index]] = [this.items[index], this.items[parent]];
      index = parent;
    }
  }

  sinkDown(index) {
    while (true) {
      const left = index * 2 + 1;
      const right = index * 2 + 2;
      let smallest = index;

      if (left < this.items.length && this.items[left].priority < this.items[smallest].priority) {
        smallest = left;
      }

      if (right < this.items.length && this.items[right].priority < this.items[smallest].priority) {
        smallest = right;
      }

      if (smallest === index) break;
      [this.items[index], this.items[smallest]] = [this.items[smallest], this.items[index]];
      index = smallest;
    }
  }

  get size() {
    return this.items.length;
  }
}

function buildAdjacency(nodes, edges, mode) {
  const graph = new Map(nodes.map((node) => [node.id, []]));

  edges.forEach((edge) => {
    const weight = mode === 'shortest' ? edge.distanceKm : edge.travelMinutes;
    graph.get(edge.from).push({ nodeId: edge.to, edgeId: edge.id, weight });
    graph.get(edge.to).push({ nodeId: edge.from, edgeId: edge.id, weight });
  });

  return graph;
}

function reconstruct(previous, destinationId) {
  const path = [];
  const edgeIds = [];
  let current = destinationId;

  while (current) {
    path.unshift(current);
    const prev = previous.get(current);
    if (prev?.edgeId) edgeIds.unshift(prev.edgeId);
    current = prev?.nodeId;
  }

  return { path, edgeIds };
}

function runDijkstra(nodes, edges, sourceId, destinationId, mode = 'fastest') {
  const adjacency = buildAdjacency(nodes, edges, mode);
  const distances = new Map(nodes.map((node) => [node.id, Infinity]));
  const previous = new Map();
  const visited = new Set();
  const queue = new MinHeap();
  const visitedOrder = [];
  const explorationEdges = [];
  let relaxedEdges = 0;

  distances.set(sourceId, 0);
  queue.push({ nodeId: sourceId, priority: 0 });

  while (queue.size) {
    const current = queue.pop();
    if (!current || visited.has(current.nodeId)) continue;

    visited.add(current.nodeId);
    visitedOrder.push(current.nodeId);
    if (current.nodeId === destinationId) break;

    adjacency.get(current.nodeId).forEach((neighbor) => {
      if (visited.has(neighbor.nodeId)) return;

      const candidate = distances.get(current.nodeId) + neighbor.weight;
      relaxedEdges += 1;
      explorationEdges.push(neighbor.edgeId);

      if (candidate < distances.get(neighbor.nodeId)) {
        distances.set(neighbor.nodeId, candidate);
        previous.set(neighbor.nodeId, {
          nodeId: current.nodeId,
          edgeId: neighbor.edgeId,
        });
        queue.push({ nodeId: neighbor.nodeId, priority: candidate });
      }
    });
  }

  if (!Number.isFinite(distances.get(destinationId))) {
    return {
      path: [],
      edgeIds: [],
      visitedNodes: visited.size,
      visitedOrder,
      explorationEdges,
      relaxedEdges,
    };
  }

  return {
    ...reconstruct(previous, destinationId),
    cost: Number(distances.get(destinationId).toFixed(3)),
    visitedNodes: visited.size,
    visitedOrder,
    explorationEdges,
    relaxedEdges,
  };
}

module.exports = { runDijkstra };
