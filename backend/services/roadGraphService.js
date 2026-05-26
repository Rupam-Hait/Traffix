const {
  getPerpendicular,
  haversineDistance,
  interpolatePoint,
  offsetPoint,
} = require('../utils/geo');

function addEdge(edges, nodes, from, to, roadType = 'arterial') {
  const start = nodes.find((node) => node.id === from);
  const end = nodes.find((node) => node.id === to);
  const distanceKm = haversineDistance(start, end);

  edges.push({
    id: `${from}-${to}`,
    from,
    to,
    roadType,
    distanceKm,
    coordinates: [
      [start.lat, start.lng],
      [end.lat, end.lng],
    ],
  });
}

function buildRoadGraph(source, destination) {
  const tripDistance = haversineDistance(source, destination);
  const layerCount = Math.min(12, Math.max(4, Math.ceil(tripDistance / 0.9)));
  const perpendicular = getPerpendicular(source, destination);
  const offsetKm = Math.min(1.2, Math.max(0.25, tripDistance * 0.08));
  const nodes = [
    { id: 'origin', name: source.name, lat: source.lat, lng: source.lng },
    { id: 'destination', name: destination.name, lat: destination.lat, lng: destination.lng },
  ];
  const layers = [['origin']];

  for (let index = 1; index < layerCount; index += 1) {
    const ratio = index / layerCount;
    const center = interpolatePoint(source, destination, ratio);
    const left = offsetPoint(center, perpendicular, offsetKm);
    const right = offsetPoint(center, perpendicular, -offsetKm);
    const layer = [
      { id: `c-${index}`, ...center },
      { id: `l-${index}`, ...left },
      { id: `r-${index}`, ...right },
    ];

    layer.forEach((node) => nodes.push({ ...node, name: `Route point ${index}` }));
    layers.push(layer.map((node) => node.id));
  }

  layers.push(['destination']);

  const edges = [];
  for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex += 1) {
    const currentLayer = layers[layerIndex];
    const nextLayer = layers[layerIndex + 1];

    currentLayer.forEach((from) => {
      nextLayer.forEach((to) => {
        const isCenterRoad = from.startsWith('c') || from === 'origin';
        addEdge(edges, nodes, from, to, isCenterRoad ? 'express' : 'connector');
      });
    });

    if (layerIndex > 0) {
      addEdge(edges, nodes, `l-${layerIndex}`, `c-${layerIndex}`, 'local');
      addEdge(edges, nodes, `c-${layerIndex}`, `r-${layerIndex}`, 'local');
    }
  }

  return {
    sourceId: 'origin',
    destinationId: 'destination',
    nodes,
    edges,
  };
}

module.exports = { buildRoadGraph };
