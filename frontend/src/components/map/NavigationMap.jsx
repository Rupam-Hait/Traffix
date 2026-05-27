import L from 'leaflet';
import { useEffect, useRef } from 'react';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const STEP_DELAYS = {
  slow: 80,
  medium: 30,
  fast: 8,
};

const REVEAL_STEP_DELAY = STEP_DELAYS.medium;

const MODE_CONFIG = {
  car: {
    explorationColor: '#7cc7f8',
    explorationOpacity: 0.72,
    pathColor: '#2f8fed',
    pathGlowColor: '#7cc7f8',
    pathWeight: 4,
    hasTrafficColors: true,
  },
  bike: {
    explorationColor: '#7cc7f8',
    explorationOpacity: 0.72,
    pathColor: '#ff8c00',
    pathGlowColor: '#ff8c00',
    pathWeight: 4,
    hasTrafficColors: true,
  },
  cycling: {
    explorationColor: '#00e5ff',
    explorationOpacity: 0.82,
    pathColor: '#00e5ff',
    pathGlowColor: '#00e5ff',
    pathWeight: 4.8,
    hasTrafficColors: false,
    usePhaseAnimation: true,
  },
  walking: {
    explorationColor: '#ffffff',
    explorationOpacity: 0.78,
    pathColor: '#ffffff',
    pathGlowColor: '#ffffff',
    pathWeight: 4.8,
    hasTrafficColors: false,
    usePhaseAnimation: true,
  },
};

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

function getStepColor(step, modeConfig) {
  return modeConfig.hasTrafficColors ? (step.traffic?.color || modeConfig.explorationColor) : modeConfig.explorationColor;
}

function addExploredRoad(layer, step, modeConfig, opacity = modeConfig.explorationOpacity) {
  return L.polyline(step.coordinates, {
    color: getStepColor(step, modeConfig),
    weight: 2.45,
    opacity,
    lineCap: 'round',
    lineJoin: 'round',
    className: 'exploration-road',
  }).addTo(layer);
}

function setLayerOpacity(layer, opacity) {
  if (typeof layer.setStyle === 'function') {
    layer.setStyle({ opacity, fillOpacity: opacity });
  }
}

function renderFinalPath(layer, coordinates, modeConfig) {
  L.polyline(coordinates, {
    color: modeConfig.pathGlowColor,
    weight: modeConfig.pathWeight + 6,
    opacity: 0.24,
    lineCap: 'round',
    lineJoin: 'round',
    className: 'route-glow',
  }).addTo(layer);

  L.polyline(coordinates, {
    color: modeConfig.pathColor,
    weight: modeConfig.pathWeight,
    opacity: 0.98,
    lineCap: 'round',
    lineJoin: 'round',
    className: 'route-active',
  }).addTo(layer);
}

export default function NavigationMap({
  center,
  source,
  destination,
  route,
  fullRoute,
  visualizationSpeed = 'medium',
  onPhaseChange,
  activeMode = 'car',
  animationCached = false,
  onAnimationComplete,
}) {
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const markerLayerRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const speedRef = useRef(visualizationSpeed);
  const drawnFinalRef = useRef({ route: null, mode: null });

  useEffect(() => {
    speedRef.current = visualizationSpeed;
  }, [visualizationSpeed]);

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
    if (!mapRef.current || !trafficLayerRef.current || !routeLayerRef.current) return undefined;

    const trafficLayer = trafficLayerRef.current;
    const routeLayer = routeLayerRef.current;

    if (!route) {
      trafficLayer.clearLayers();
      routeLayer.clearLayers();
      drawnFinalRef.current = { route: null, mode: null };
      onPhaseChange?.('idle');
      return undefined;
    }

    if (animationCached && drawnFinalRef.current.route === route && drawnFinalRef.current.mode === activeMode) {
      onPhaseChange?.('complete');
      return undefined;
    }

    const modeConfig = MODE_CONFIG[activeMode] || MODE_CONFIG.car;
    const isTrafficWeightedMode = activeMode === 'car' || activeMode === 'bike';
    const isFullScanMode = Boolean(modeConfig.usePhaseAnimation);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cleanupTasks = [];
    let cancelled = false;

    const sleep = (ms) => new Promise((resolve) => {
      const id = window.setTimeout(resolve, ms);
      cleanupTasks.push(() => window.clearTimeout(id));
    });

    const waitForCurrentStepDelay = async () => {
      let elapsed = 0;
      while (!cancelled) {
        const target = STEP_DELAYS[speedRef.current] || STEP_DELAYS.medium;
        if (elapsed >= target) return;
        const chunk = Math.min(8, target - elapsed);
        await sleep(chunk);
        elapsed += chunk;
      }
    };

    const transitionClear = async () => {
      const existingLayers = [...trafficLayer.getLayers(), ...routeLayer.getLayers()];
      if (!existingLayers.length) {
        trafficLayer.clearLayers();
        routeLayer.clearLayers();
        return;
      }

      existingLayers.forEach((layer) => setLayerOpacity(layer, 0));
      await sleep(300);
      if (cancelled) return;
      trafficLayer.clearLayers();
      routeLayer.clearLayers();
    };

    const renderTrafficSegments = () => {
      if (!isTrafficWeightedMode) return;
      const trafficSegments = fullRoute?.trafficRoute?.trafficSegments || fullRoute?.trafficRoute?.segments || route.trafficSegments || route.segments;

      trafficSegments?.forEach((segment) => {
        const traffic = segment.traffic || { level: 'low', color: '#00ff88' };
        L.polyline(segment.coordinates, {
          color: traffic.color,
          weight: traffic.level === 'heavy' ? 4 : traffic.level === 'medium' ? 3.5 : 3,
          opacity: 0.2,
          lineCap: 'round',
          lineJoin: 'round',
          className: `traffic-road ${traffic.level}`,
        }).addTo(trafficLayer);
      });
    };

    const showFinalState = () => {
      const ghostSteps = route.explorationSteps || [];
      ghostSteps.forEach((step) => addExploredRoad(routeLayer, step, modeConfig, isFullScanMode ? 0.15 : 0.13));
      renderFinalPath(routeLayer, route.coordinates, modeConfig);
      drawnFinalRef.current = { route, mode: activeMode };
      onPhaseChange?.('complete');
    };

    const drawPathProgressively = async () => {
      const glowLine = L.polyline([], {
        color: modeConfig.pathGlowColor,
        weight: modeConfig.pathWeight + 6,
        opacity: 0.24,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'route-glow',
      }).addTo(routeLayer);

      const activeLine = L.polyline([], {
        color: modeConfig.pathColor,
        weight: modeConfig.pathWeight,
        opacity: 0.98,
        lineCap: 'round',
        lineJoin: 'round',
        className: 'route-active',
      }).addTo(routeLayer);

      const flowLine = L.polyline([], {
        color: modeConfig.pathGlowColor,
        weight: modeConfig.pathWeight,
        opacity: 0.56,
        dashArray: '1 15',
        lineCap: 'round',
        lineJoin: 'round',
        className: 'route-flow',
      }).addTo(routeLayer);

      const frameCount = Math.min(160, Math.max(24, route.coordinates.length));
      for (let frame = 1; frame <= frameCount && !cancelled; frame += 1) {
        const visibleCoordinates = getVisibleCoordinates(route.coordinates, frame / frameCount);
        glowLine.setLatLngs(visibleCoordinates);
        activeLine.setLatLngs(visibleCoordinates);
        flowLine.setLatLngs(visibleCoordinates);
        await sleep(REVEAL_STEP_DELAY);
      }
    };

    const addDestinationPulse = () => {
      if (!destination) return;
      L.marker([destination.lat, destination.lng], {
        icon: createDestinationPulseIcon(),
        interactive: false,
        keyboard: false,
      }).addTo(routeLayer);
    };

    const runTrafficAnimation = async () => {
      const exploredLines = [];
      const steps = route.explorationSteps || [];
      onPhaseChange?.('exploring');

      for (const step of steps) {
        if (cancelled) return;
        exploredLines.push(addExploredRoad(routeLayer, step, modeConfig));
        await waitForCurrentStepDelay();
      }

      exploredLines.forEach((line) => line.setStyle({ opacity: 0.13, weight: 2.1 }));
      addDestinationPulse();
      onPhaseChange?.('detected');
      await sleep(400);
      if (cancelled) return;

      onPhaseChange?.('revealing');
      await drawPathProgressively();
      if (cancelled) return;

      onPhaseChange?.('complete');
      drawnFinalRef.current = { route, mode: activeMode };
      onAnimationComplete?.(activeMode);
    };

    const runFullScanAnimation = async () => {
      const exploredLines = [];
      const steps = route.explorationSteps || [];
      onPhaseChange?.('exploring');

      for (const step of steps) {
        if (cancelled) return;
        exploredLines.push(addExploredRoad(routeLayer, step, modeConfig));
        await waitForCurrentStepDelay();
      }

      await sleep(400);
      if (cancelled) return;

      onPhaseChange?.('detected');
      const fadeFrames = 24;
      for (let frame = 1; frame <= fadeFrames && !cancelled; frame += 1) {
        const progress = frame / fadeFrames;
        const opacity = modeConfig.explorationOpacity * (1 - progress) + 0.15 * progress;
        exploredLines.forEach((line) => line.setStyle({ opacity, weight: 2.1 }));
        await sleep(600 / fadeFrames);
      }

      if (cancelled) return;
      addDestinationPulse();
      onPhaseChange?.('revealing');
      await drawPathProgressively();
      if (cancelled) return;

      onPhaseChange?.('complete');
      drawnFinalRef.current = { route, mode: activeMode };
      onAnimationComplete?.(activeMode);
    };

    const run = async () => {
      await transitionClear();
      if (cancelled) return;

      renderTrafficSegments();

      if (route.coordinates?.length) {
        const bounds = L.latLngBounds(route.coordinates);
        mapRef.current.fitBounds(bounds, { padding: [90, 90], maxZoom: 15, animate: true, duration: 0.8 });
      }

      if (prefersReducedMotion || animationCached) {
        showFinalState();
        if (!animationCached) onAnimationComplete?.(activeMode);
        return;
      }

      if (isFullScanMode) {
        await runFullScanAnimation();
      } else {
        await runTrafficAnimation();
      }
    };

    run();

    return () => {
      cancelled = true;
      cleanupTasks.forEach((cleanup) => cleanup());
    };
  }, [activeMode, animationCached, destination, fullRoute, onAnimationComplete, onPhaseChange, route]);

  return <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full" aria-label="Traffix map" />;
}
