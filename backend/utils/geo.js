const EARTH_RADIUS_KM = 6371;

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function haversineDistance(a, b) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function interpolatePoint(a, b, ratio) {
  return {
    lat: a.lat + (b.lat - a.lat) * ratio,
    lng: a.lng + (b.lng - a.lng) * ratio,
  };
}

function offsetPoint(point, perpendicular, offsetKm) {
  const latOffset = (perpendicular.lat * offsetKm) / 111;
  const lngFactor = 111 * Math.max(0.25, Math.cos(toRadians(point.lat)));
  const lngOffset = (perpendicular.lng * offsetKm) / lngFactor;

  return {
    lat: point.lat + latOffset,
    lng: point.lng + lngOffset,
  };
}

function getPerpendicular(source, destination) {
  const dLat = destination.lat - source.lat;
  const dLng = destination.lng - source.lng;
  const magnitude = Math.hypot(dLat, dLng) || 1;

  return {
    lat: -dLng / magnitude,
    lng: dLat / magnitude,
  };
}

module.exports = {
  getPerpendicular,
  haversineDistance,
  interpolatePoint,
  offsetPoint,
};
