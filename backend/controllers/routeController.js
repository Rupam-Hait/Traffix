const { getRoute } = require('../services/realRoutingService');
const SUPPORTED_MODES = new Set(['shortest', 'fastest']);

// Transport mode speeds in km/h
const TRANSPORT_SPEEDS = {
  walking: 5,
  cycling: 15,
  bike: 40,
  car: 60,
};

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

/**
 * Calculate travel times for all transport modes based on distance
 * Returns minutes for walking, cycling, bike, and car modes
 */
function calculateTravelTimes(distanceKm) {
  const times = {};
  
  // Calculate minutes for each mode using: (distance / speed) * 60
  times.walking = Math.max(1, Math.round((distanceKm / TRANSPORT_SPEEDS.walking) * 60));
  times.cycling = Math.max(1, Math.round((distanceKm / TRANSPORT_SPEEDS.cycling) * 60));
  times.bike = Math.max(1, Math.round((distanceKm / TRANSPORT_SPEEDS.bike) * 60));
  times.car = Math.max(1, Math.round((distanceKm / TRANSPORT_SPEEDS.car) * 60));

  return times;
}

function serializeSegment(segment) {
  return {
    id: segment.id,
    name: segment.name,
    coordinates: segment.coordinates,
    traffic: segment.traffic,
    distanceKm: Number(segment.distanceKm.toFixed(3)),
    durationSeconds: segment.durationSeconds,
    travelMinutes: Number(segment.travelMinutes.toFixed(1)),
    trafficAdjustedMinutes: segment.trafficAdjustedMinutes,
    maneuver: segment.maneuver,
  };
}

/**
 * Build route object for API response
 */
function buildRouteResponse(routeData) {
  if (!routeData || !routeData.metrics) {
    return null;
  }

  const distanceKm = routeData.metrics.distanceKm;
  const trafficAdjustedMinutes = routeData.metrics.trafficAdjustedMinutes;

  return {
    coordinates: routeData.coordinates,
    segments: routeData.segments.map(serializeSegment),
    trafficSegments: (routeData.trafficSegments || routeData.segments).map(serializeSegment),
    explorationSteps: routeData.explorationSteps,
    finalPathSteps: routeData.finalPathSteps,
    metrics: {
      distanceKm: Number(distanceKm.toFixed(2)),
      trafficAdjustedMinutes: Number(trafficAdjustedMinutes.toFixed(1)),
      visitedNodes: routeData.metrics.visitedNodes,
      relaxedEdges: routeData.metrics.relaxedEdges,
      candidateRoads: routeData.metrics.candidateRoads,
      // Travel times for all modes
      travelTimes: calculateTravelTimes(distanceKm),
    },
  };
}

async function calculateRoute(req, res, next) {
  try {
    const mode = SUPPORTED_MODES.has(req.body?.mode) ? req.body.mode : 'fastest';
    const source = parseLocation(req.body?.source, 'Source');
    const destination = parseLocation(req.body?.destination, 'Destination');

    const dualRoutes = await getRoute(source, destination, mode);

    // Build responses for both routes
    const trafficRoute = buildRouteResponse(dualRoutes.trafficRoute, 'traffic');
    const freeRoute = buildRouteResponse(dualRoutes.freeRoute, 'free');

    // Check if free route is valid (may not exist if no walking path found)
    const hasFreeRoute = freeRoute && freeRoute.coordinates && freeRoute.coordinates.length > 0;

    // Calculate overall travel times (use traffic route as primary for display)
    const primaryRoute = trafficRoute;
    const allModeTravelTimes = calculateTravelTimes(primaryRoute.metrics.distanceKm);

    // Build response
    res.json({
      mode,
      algorithm: 'Dual Dijkstra Real-Road Search',
      source,
      destination,
      trafficRoute,
      freeRoute: hasFreeRoute ? freeRoute : null,
      hasFreeRoute,
      travelTimes: {
        traffic: trafficRoute.metrics.travelTimes,
        free: freeRoute ? freeRoute.metrics.travelTimes : null,
        all: allModeTravelTimes, // For backward compatibility
      },
      metrics: {
        distanceKm: Number(primaryRoute.metrics.distanceKm.toFixed(2)),
        trafficAdjustedMinutes: Math.max(1, Math.round(primaryRoute.metrics.trafficAdjustedMinutes)),
        carMinutes: Math.max(1, Math.round(primaryRoute.metrics.trafficAdjustedMinutes)),
        visitedNodes: primaryRoute.metrics.visitedNodes,
        relaxedEdges: primaryRoute.metrics.relaxedEdges,
        candidateRoads: primaryRoute.metrics.candidateRoads,
        optimizationBasis: mode === 'shortest' ? 'distance' : 'traffic-adjusted travel time',
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { calculateRoute };
