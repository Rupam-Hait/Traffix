import L from 'leaflet';
import { useEffect, useRef } from 'react';

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; OpenStreetMap contributors';

const SPEED_CONFIG = {
  slow: { exploration: 9200, detection: 1200, reveal: 3600 },
  medium: { exploration: 5600, detection: 850, reveal: 2200 },
  fast: { exploration: 2800, detection: 520, reveal: 1100 },
};

const ROUTE_BLUE = '#2f8fed';
const ROUTE_BLUE_SOFT = '#7cc7f8';

function createMarkerIcon(type) {
  const label = type === 'source' ? 'A' : 'B';

  return L.divIcon({
    className: `traffix-pin traffix-pin-${type}`,
    html: `<span>${label}</span>`,
    iconSize: [42, 42],
    iconAnchor: [21, 38],
  });
}

function addMarker(layer, location, type) {
  if (!location) return;

  L.marker([location.lat, location.lng], {
    icon: createMarkerIcon(type),
    riseOnHover: true,
  })
    .bindTooltip(location.name, {
      direction: 'top',
      offset: [0, -36],
      className: 'traffix-tooltip',
    })
    .addTo(layer);
}

function createDestinationPulseIcon() {
  return L.divIcon({
    className: 'destination-pulse',
    html: '<span></span>',
    iconSize: [62, 62],
    iconAnchor: [31, 31],
  });
}

function getVisibleCoordinates(coordinates, progress) {
  if (!coordinates?.length) return [];
  if (coordinates.length <= 2) return coordinates.slice(0, Math.max(1, Math.ceil(progress * coordinates.length)));

  const visibleCount = Math.max(2, Math.ceil(progress * (coordinates.length - 1)) + 1);
  return coordinates.slice(0, Math.min(coordinates.length, visibleCount));
}

function addExploredRoad(layer, step) {
  return L.polyline(step.coordinates, {
    color: ROUTE_BLUE_SOFT,
    weight: 2.4,
    opacity: step.isFinal ? 0.34 : 0.22,
    lineCap: 'round',
    lineJoin: 'round',
    className: 'exploration-road',
  }).addTo(layer);
}

function drawFinalRoute(layer, route, duration, onComplete) {
  const coordinates = route.route.coordinates;
  const glowLine = L.polyline([], {
    color: ROUTE_BLUE_SOFT,
    weight: 8,
    opacity: 0.2,
    lineCap: 'round',
    lineJoin: 'round',
    className: 'route-glow',
  }).addTo(layer);

  const activeLine = L.polyline([], {
    color: ROUTE_BLUE,
    weight: 4,
    opacity: 0.96,
    lineCap: 'round',
    lineJoin: 'round',
    className: 'route-active',
  }).addTo(layer);

  const flowLine = L.polyline([], {
    color: '#fefae0',
    weight: 4,
    opacity: 0.72,
    dashArray: '1 15',
    lineCap: 'round',
    lineJoin: 'round',
    className: 'route-flow',
  }).addTo(layer);

  let frameId;
  const start = performance.now();

  function draw(now) {
    const progress = Math.min(1, (now - start) / duration);
    const visibleCoordinates = getVisibleCoordinates(coordinates, progress);

    glowLine.setLatLngs(visibleCoordinates);
    activeLine.setLatLngs(visibleCoordinates);
    flowLine.setLatLngs(visibleCoordinates);

    if (progress < 1) {
      frameId = requestAnimationFrame(draw);
      return;
    }

    onComplete?.();
  }

  frameId = requestAnimationFrame(draw);
  return () => cancelAnimationFrame(frameId);
}

export default function NavigationMap({
  center,
  source,
  destination,
  route,
  visualizationSpeed = 'medium',
  onPhaseChange,
}) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markerLayerRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const routeLayerRef = useRef(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
      preferCanvas: false,
    }).setView([center.lat, center.lng], 6);

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(mapRef.current);

    L.control.zoom({ position: 'bottomleft' }).addTo(mapRef.current);
    markerLayerRef.current = L.layerGroup().addTo(mapRef.current);
    trafficLayerRef.current = L.layerGroup().addTo(mapRef.current);
    routeLayerRef.current = L.layerGroup().addTo(mapRef.current);
  }, [center.lat, center.lng]);

  useEffect(() => {
    if (!mapRef.current || source || destination || route) return;
    mapRef.current.flyTo([center.lat, center.lng], 6, { duration: 1.1 });
  }, [center, source, destination, route]);

  useEffect(() => {
    if (!markerLayerRef.current || !mapRef.current) return;

    markerLayerRef.current.clearLayers();
    addMarker(markerLayerRef.current, source, 'source');
    addMarker(markerLayerRef.current, destination, 'destination');

    const points = [source, destination].filter(Boolean).map((point) => [point.lat, point.lng]);
    if (points.length === 1) {
      mapRef.current.flyTo(points[0], 13, { duration: 1 });
    }
  }, [source, destination]);

  useEffect(() => {
    if (!mapRef.current || !trafficLayerRef.current || !routeLayerRef.current) return;

    trafficLayerRef.current.clearLayers();
    routeLayerRef.current.clearLayers();

    if (!route) {
      onPhaseChange?.('idle');
      return;
    }

    const speed = SPEED_CONFIG[visualizationSpeed] || SPEED_CONFIG.medium;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanupTasks = [];
    let cancelled = false;

    route.trafficSegments.forEach((segment) => {
      L.polyline(segment.coordinates, {
        color: segment.traffic.color,
        weight: segment.traffic.level === 'heavy' ? 4 : 3,
        opacity: segment.traffic.level === 'low' ? 0.2 : 0.3,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'traffic-road',
      }).addTo(trafficLayerRef.current);
    });

    const coordinates = route.route.coordinates;
    const bounds = L.latLngBounds(coordinates);
    mapRef.current.fitBounds(bounds, { padding: [90, 90], maxZoom: 15, animate: true, duration: 0.8 });

    if (prefersReducedMotion) {
      route.explorationSteps?.forEach((step) => addExploredRoad(routeLayerRef.current, step));
      L.polyline(coordinates, {
        color: ROUTE_BLUE,
        weight: 4,
        opacity: 0.96,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(routeLayerRef.current);
      onPhaseChange?.('complete');
      return;
    }

    const explorationSteps = route.explorationSteps?.length
      ? route.explorationSteps
      : route.route.segments;
    const exploredLines = [];
    const activeGlow = L.polyline([], {
      color: ROUTE_BLUE_SOFT,
      weight: 7,
      opacity: 0.22,
      lineCap: 'round',
      lineJoin: 'round',
      className: 'exploration-wave-glow',
    }).addTo(routeLayerRef.current);

    const activeScan = L.polyline([], {
      color: ROUTE_BLUE,
      weight: 3.4,
      opacity: 0.7,
      lineCap: 'round',
      lineJoin: 'round',
      className: 'exploration-wave',
    }).addTo(routeLayerRef.current);

    let frameId;
    let completedCount = 0;
    const start = performance.now();
    onPhaseChange?.('exploring');

    function finishExploration() {
      if (cancelled) return;

      activeGlow.setLatLngs([]);
      activeScan.setLatLngs([]);
      exploredLines.forEach((line) => line.setStyle({ opacity: 0.13, weight: 2.1 }));

      if (destination) {
        L.marker([destination.lat, destination.lng], {
          icon: createDestinationPulseIcon(),
          interactive: false,
          keyboard: false,
        }).addTo(routeLayerRef.current);
      }

      onPhaseChange?.('detected');

      const detectionTimer = window.setTimeout(() => {
        if (cancelled) return;
        onPhaseChange?.('revealing');
        cleanupTasks.push(
          drawFinalRoute(routeLayerRef.current, route, speed.reveal, () => {
            if (!cancelled) onPhaseChange?.('complete');
          }),
        );
      }, speed.detection);
      cleanupTasks.push(() => window.clearTimeout(detectionTimer));
    }

    function drawExploration(now) {
      const progress = Math.min(1, (now - start) / speed.exploration);
      const scanPosition = progress * explorationSteps.length;
      const nextCompletedCount = Math.min(explorationSteps.length, Math.floor(scanPosition));

      for (let index = completedCount; index < nextCompletedCount; index += 1) {
        exploredLines.push(addExploredRoad(routeLayerRef.current, explorationSteps[index]));
      }
      completedCount = nextCompletedCount;

      const activeStep = explorationSteps[Math.min(nextCompletedCount, explorationSteps.length - 1)];
      const segmentProgress = scanPosition - nextCompletedCount;

      if (activeStep) {
        const visibleCoordinates = getVisibleCoordinates(activeStep.coordinates, segmentProgress || 0.08);
        activeGlow.setLatLngs(visibleCoordinates);
        activeScan.setLatLngs(visibleCoordinates);
      }

      if (progress < 1) {
        frameId = requestAnimationFrame(drawExploration);
      } else {
        for (let index = completedCount; index < explorationSteps.length; index += 1) {
          exploredLines.push(addExploredRoad(routeLayerRef.current, explorationSteps[index]));
        }
        finishExploration();
      }
    }

    frameId = requestAnimationFrame(drawExploration);
    cleanupTasks.push(() => cancelAnimationFrame(frameId));

    return () => {
      cancelled = true;
      cleanupTasks.forEach((cleanup) => cleanup());
    };
  }, [destination, onPhaseChange, route, visualizationSpeed]);

  return <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full" aria-label="Traffix map" />;
}
