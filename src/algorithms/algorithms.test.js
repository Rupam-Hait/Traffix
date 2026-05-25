import dijkstra from './dijkstra';
import astar from './astar';
import bfs from './bfs';
import dfs from './dfs';
import floydWarshall from './floydWarshall';
import { EDGES, NODES, edgeKey } from '../data/cityGraph';

const defaultTraffic = Object.fromEntries(EDGES.map((edge) => [edgeKey(edge.from, edge.to), 1]));

describe('pathfinding algorithms', () => {
  test('Dijkstra finds the weighted shortest route from A to O', () => {
    const result = dijkstra(NODES, EDGES, defaultTraffic, 'A', 'O');
    expect(result.path).toEqual(['A', 'G', 'I', 'O']);
    expect(result.cost).toBe(7);
    expect(result.steps.some((step) => step.type === 'finalize')).toBe(true);
  });

  test('A* finds the same optimal route with the Euclidean heuristic', () => {
    const result = astar(NODES, EDGES, defaultTraffic, 'A', 'O');
    expect(result.path).toEqual(['A', 'G', 'I', 'O']);
    expect(result.cost).toBe(7);
  });

  test('BFS ignores weights and returns a minimum-hop route', () => {
    const result = bfs(NODES, EDGES, defaultTraffic, 'A', 'O');
    expect(result.path.length - 1).toBe(3);
    expect(result.steps[0]).toMatchObject({ type: 'visit', nodeId: 'A' });
  });

  test('DFS returns a valid source-to-destination traversal path', () => {
    const result = dfs(NODES, EDGES, defaultTraffic, 'A', 'O');
    expect(result.path[0]).toBe('A');
    expect(result.path[result.path.length - 1]).toBe('O');
    expect(result.nodesVisited).toBeGreaterThan(0);
  });

  test('Floyd-Warshall computes all-pairs shortest path cost', () => {
    const result = floydWarshall(NODES, EDGES, defaultTraffic);
    const a = result.labels.indexOf('A');
    const o = result.labels.indexOf('O');
    expect(result.matrix[a][o]).toBe(7);
  });
});
