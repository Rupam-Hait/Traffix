const TRAFFIC = {
  low: {
    label: 'Low Traffic',
    multiplier: 1.05,
    color: '#22c55e',
  },
  medium: {
    label: 'Medium Traffic',
    multiplier: 1.55,
    color: '#facc15',
  },
  heavy: {
    label: 'Heavy Traffic',
    multiplier: 2.35,
    color: '#ef4444',
  },
};

function hashString(value) {
  return value.split('').reduce((hash, character) => hash + character.charCodeAt(0), 0);
}

function getTrafficLevel(edge) {
  const hour = new Date().getHours();
  const rushHourPressure = hour >= 8 && hour <= 10 ? 2 : hour >= 17 && hour <= 20 ? 2 : 0;
  const seed = (hashString(edge.id) + rushHourPressure + Math.floor(Date.now() / 45000)) % 10;

  if (edge.roadType === 'express' && seed <= 4) return 'low';
  if (seed >= 8) return 'heavy';
  if (seed >= 4) return 'medium';
  return 'low';
}

function applyTrafficToEdges(edges) {
  return edges.map((edge) => {
    const level = getTrafficLevel(edge);
    const traffic = TRAFFIC[level];
    const baseSpeedKph = edge.roadType === 'express' ? 58 : edge.roadType === 'local' ? 26 : 42;
    const travelMinutes = (edge.distanceKm / (baseSpeedKph / traffic.multiplier)) * 60;

    return {
      ...edge,
      traffic: {
        level,
        label: traffic.label,
        multiplier: traffic.multiplier,
        color: traffic.color,
      },
      travelMinutes,
    };
  });
}

module.exports = { applyTrafficToEdges };
