/**
 * Real routing service using OSRM (Open Source Routing Machine)
 * 
 * OSRM returns actual road geometry, distances, and durations.
 * This replaces the fake graph system with real routing data.
 */

const fetch = require('node-fetch');
const { runDijkstra } = require('../algorithms/dijkstra');
const { applyTrafficToSegments } = require('./trafficService');

const OSRM_URL = 'https://router.project-osrm.org';

/**
 * Fetch route from OSRM
 * Supports multiple profiles: car, bike, foot
 * Returns actual road geometry and metrics
 */
async function fetchOSRMRoute(source, destination, profile = 'car') {
  const coordinates = `${source.lng},${source.lat};${destination.lng},${destination.lat}`;
  const url = `${OSRM_URL}/route/v1/${profile}/${coordinates}?geometries=geojson&steps=true&alternatives=true&annotations=distance,duration,speed`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM request failed: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch route from OSRM: ${error.message}`);
  }
}

function toLeafletCoordinates(coordinates) {
  return coordinates.map(([lng, lat]) => [lat, lng]);
}

function nodeIdFor([lat, lng]) {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

function addNode(nodes, coordinates) {
  const id = nodeIdFor(coordinates);
  if (!nodes.has(id)) {
    nodes.set(id, {
      id,
      lat: coordinates[0],
      lng: coordinates[1],
    });
  }
  return id;
}

function stableTrafficKey(name, from, to) {
  const endpoints = [from, to].sort().join('|');
  return `${name || 'Road'}|${endpoints}`;
}

function appendCoordinates(target, coordinates) {
  coordinates.forEach((coordinate, index) => {
    if (index === 0 && target.length) return;
    target.push(coordinate);
  });
}

function stitchRouteCoordinates(edgeIds, edgeById, path) {
  const coordinates = [];

  edgeIds.forEach((edgeId, index) => {
    const edge = edgeById.get(edgeId);
    if (!edge) return;

    const fromNode = path[index];
    const toNode = path[index + 1];
    const segmentCoordinates =
      edge.from === fromNode && edge.to === toNode
        ? edge.coordinates
        : [...edge.coordinates].reverse();

    appendCoordinates(coordinates, segmentCoordinates);
  });

  return coordinates;
}

function getStepsFromRoute(route) {
  return (route.legs || []).flatMap((leg) => leg.steps || []);
}

function buildEdgeFromStep(step, routeIndex, stepIndex, nodes) {
  const coordinates = toLeafletCoordinates(step.geometry.coordinates);
  if (coordinates.length < 2 || step.distance <= 0) return null;

  const from = addNode(nodes, coordinates[0]);
  const to = addNode(nodes, coordinates[coordinates.length - 1]);
  if (from === to) return null;

  const name = step.name || 'Road';

  return {
    id: `road-${routeIndex}-${stepIndex}`,
    from,
    to,
    roadType: 'real-road',
    distanceKm: step.distance / 1000,
    durationSeconds: step.duration,
    travelMinutes: step.duration / 60,
    coordinates,
    name,
    maneuver: step.maneuver?.type || 'continue',
    trafficKey: stableTrafficKey(name, from, to),
  };
}

function buildRealRoadCorridor(osrmData) {
  if (!osrmData.routes || osrmData.routes.length === 0) {
    throw new Error('No route found from OSRM');
  }

  const nodes = new Map();
  const edges = [];
  let globalStepIndex = 0;

  osrmData.routes.forEach((route, routeIndex) => {
    const steps = getStepsFromRoute(route);

    if (!steps.length) {
      const coordinates = toLeafletCoordinates(route.geometry.coordinates);
      const from = addNode(nodes, coordinates[0]);
      const to = addNode(nodes, coordinates[coordinates.length - 1]);
      edges.push({
        id: `road-${routeIndex}-${globalStepIndex}`,
        from,
        to,
        roadType: 'real-road',
        distanceKm: route.distance / 1000,
        durationSeconds: route.duration,
        travelMinutes: route.duration / 60,
        coordinates,
        name: 'Road',
        maneuver: 'continue',
        trafficKey: stableTrafficKey('Road', from, to),
      });
      globalStepIndex += 1;
      return;
    }

    steps.forEach((step) => {
      const edge = buildEdgeFromStep(step, routeIndex, globalStepIndex, nodes);
      globalStepIndex += 1;
      if (edge) edges.push(edge);
    });
  });

  const primaryCoordinates = toLeafletCoordinates(osrmData.routes[0].geometry.coordinates);
  const sourceId = nodeIdFor(primaryCoordinates[0]);
  const destinationId = nodeIdFor(primaryCoordinates[primaryCoordinates.length - 1]);

  return {
    nodes: Array.from(nodes.values()),
    edges,
    sourceId,
    destinationId,
  };
}

function uniqueEdgeIds(edgeIds) {
  const seen = new Set();
  return edgeIds.filter((edgeId) => {
    if (seen.has(edgeId)) return false;
    seen.add(edgeId);
    return true;
  });
}

function buildDijkstraRoute(osrmData, source, destination, mode = 'fastest') {
  const corridor = buildRealRoadCorridor(osrmData);
  const trafficEdges = applyTrafficToSegments(corridor.edges).map((edge) => ({
    ...edge,
    travelMinutes: edge.trafficAdjustedMinutes,
  }));
  const edgeById = new Map(trafficEdges.map((edge) => [edge.id, edge]));
  const result = runDijkstra(
    corridor.nodes,
    trafficEdges,
    corridor.sourceId,
    corridor.destinationId,
    mode,
  );

  const finalEdgeIds = result.edgeIds.length
    ? result.edgeIds
    : trafficEdges.map((edge) => edge.id).slice(0, 1);
  const finalSegments = finalEdgeIds.map((edgeId) => edgeById.get(edgeId)).filter(Boolean);
  const finalCoordinates = result.path.length
    ? stitchRouteCoordinates(finalEdgeIds, edgeById, result.path)
    : finalSegments.flatMap((segment) => segment.coordinates);
  const explorationEdgeIds = uniqueEdgeIds([...result.explorationEdges, ...finalEdgeIds]);
  const explorationSteps = explorationEdgeIds
    .map((edgeId, order) => {
      const edge = edgeById.get(edgeId);
      if (!edge) return null;
      return {
        id: edge.id,
        order,
        coordinates: edge.coordinates,
        traffic: edge.traffic,
        distanceKm: Number(edge.distanceKm.toFixed(3)),
        travelMinutes: Number(edge.travelMinutes.toFixed(1)),
        isFinal: finalEdgeIds.includes(edge.id),
      };
    })
    .filter(Boolean);

  const totalDistanceKm = finalSegments.reduce((sum, segment) => sum + segment.distanceKm, 0);
  const totalTrafficAdjustedMinutes = finalSegments.reduce(
    (sum, segment) => sum + segment.trafficAdjustedMinutes,
    0,
  );

  return {
    coordinates: finalCoordinates,
    segments: finalSegments,
    explorationSteps,
    trafficSegments: trafficEdges,
    metrics: {
      distanceKm: totalDistanceKm,
      trafficAdjustedMinutes: totalTrafficAdjustedMinutes,
      visitedNodes: result.visitedNodes,
      relaxedEdges: result.relaxedEdges,
      candidateRoads: trafficEdges.length,
      cost: result.cost,
    },
    source,
    destination,
  };
}

/**
 * Convert OSRM route to Traffix route format
 * Includes coordinates, segments, and metrics
 */
function parseOSRMRoute(osrmData, source, destination, profile = 'car') {
  if (!osrmData.routes || osrmData.routes.length === 0) {
    throw new Error('No route found from OSRM');
  }

  // Use first route (shortest by default)
  const route = osrmData.routes[0];
  const geometry = route.geometry.coordinates;
  
  // Convert to [lat, lng] format for Leaflet
  const coordinates = geometry.map(([lng, lat]) => [lat, lng]);
  
  // Convert to meters and seconds
  const distanceMeters = route.distance;
  const durationSeconds = route.duration;
  const distanceKm = distanceMeters / 1000;
  const durationMinutes = durationSeconds / 60;

  // Parse route steps into segments
  const segments = [];
  let stepIndex = 0;

  if (route.legs && route.legs[0].steps) {
    route.legs[0].steps.forEach((step, idx) => {
      const stepGeometry = step.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      segments.push({
        id: `segment-${idx}`,
        coordinates: stepGeometry,
        distanceKm: (step.distance / 1000),
        durationSeconds: step.duration,
        name: step.name || 'Road',
        maneuver: step.maneuver?.type || 'straight',
      });
    });
  } else {
    // Fallback: create single segment if steps not available
    segments.push({
      id: 'segment-0',
      coordinates,
      distanceKm,
      durationSeconds,
      name: `${source.name} to ${destination.name}`,
      maneuver: 'straight',
    });
  }

  return {
    coordinates,
    segments,
    metrics: {
      distanceKm: Number(distanceKm.toFixed(2)),
      durationSeconds: Math.round(durationSeconds),
      durationMinutes: Math.round(durationMinutes),
      profile,
    },
    allRoutes: osrmData.routes,
  };
}

/**
 * Get shortest route (optimized for distance)
 */
async function getShortestRoute(source, destination) {
  const osrmData = await fetchOSRMRoute(source, destination, 'car');
  return buildDijkstraRoute(osrmData, source, destination, 'shortest');
}

/**
 * Get fastest route (optimized for time, considering traffic-like preferences)
 * Currently uses OSRM alternatives to find different routes and selects fastest
 */
async function getFastestRoute(source, destination) {
  const osrmData = await fetchOSRMRoute(source, destination, 'car');
  return buildDijkstraRoute(osrmData, source, destination, 'fastest');
}

/**
 * Get route with specified mode (shortest or fastest)
 */
async function getRoute(source, destination, mode = 'fastest') {
  if (mode === 'shortest') {
    return getShortestRoute(source, destination);
  }
  return getFastestRoute(source, destination);
}

module.exports = {
  getRoute,
  getShortestRoute,
  getFastestRoute,
  fetchOSRMRoute,
  parseOSRMRoute,
  buildDijkstraRoute,
};
