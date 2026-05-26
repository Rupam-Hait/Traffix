const { runDijkstra } = require('../algorithms/dijkstra');
const { buildRoadGraph } = require('../services/roadGraphService');
const { applyTrafficToEdges } = require('../services/trafficService');
const { getTravelProfiles } = require('../services/travelTimeService');

const SUPPORTED_MODES = new Set(['shortest', 'fastest']);

function parseLocation(value, label) {
  const lat = Number(value?.lat);
  const lng = Number(value?.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    const error = new Error(`${label} location must include valid lat and lng values.`);
    error.status = 400;
    throw error;
  }

  return {
    name: value?.name || label,
    lat,
    lng,
  };
}

function calculateRoute(req, res, next) {
  try {
    const mode = SUPPORTED_MODES.has(req.body?.mode) ? req.body.mode : 'fastest';
    const source = parseLocation(req.body?.source, 'Source');
    const destination = parseLocation(req.body?.destination, 'Destination');

    const graph = buildRoadGraph(source, destination);
    const trafficEdges = applyTrafficToEdges(graph.edges);
    const result = runDijkstra(graph.nodes, trafficEdges, graph.sourceId, graph.destinationId, mode);

    if (!result.path.length) {
      const error = new Error('No route could be calculated between the selected locations.');
      error.status = 422;
      throw error;
    }

    const nodeLookup = new Map(graph.nodes.map((node) => [node.id, node]));
    const edgeLookup = new Map(trafficEdges.map((edge) => [edge.id, edge]));
    const routeCoordinates = result.path.map((nodeId) => {
      const node = nodeLookup.get(nodeId);
      return [node.lat, node.lng];
    });
    const routeSegments = result.edgeIds.map((edgeId) => edgeLookup.get(edgeId)).filter(Boolean);
    const distanceKm = routeSegments.reduce((sum, edge) => sum + edge.distanceKm, 0);
    const carMinutes = routeSegments.reduce((sum, edge) => sum + edge.travelMinutes, 0);

    res.json({
      mode,
      algorithm: 'Dijkstra',
      source,
      destination,
      route: {
        coordinates: routeCoordinates,
        segments: routeSegments.map((edge) => ({
          id: edge.id,
          from: edge.from,
          to: edge.to,
          coordinates: edge.coordinates,
          traffic: edge.traffic,
          distanceKm: Number(edge.distanceKm.toFixed(3)),
          travelMinutes: Number(edge.travelMinutes.toFixed(1)),
        })),
      },
      trafficSegments: trafficEdges.map((edge) => ({
        id: edge.id,
        coordinates: edge.coordinates,
        traffic: edge.traffic,
      })),
      metrics: {
        distanceKm: Number(distanceKm.toFixed(2)),
        carMinutes: Math.max(1, Math.round(carMinutes)),
        travelTimes: getTravelProfiles(distanceKm, carMinutes),
        visitedNodes: result.visitedNodes,
        relaxedEdges: result.relaxedEdges,
        optimizationBasis: mode === 'shortest' ? 'distance' : 'traffic-adjusted travel time',
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { calculateRoute };
