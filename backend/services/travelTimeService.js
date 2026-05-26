function minutesFor(distanceKm, speedKph) {
  return Math.max(1, Math.round((distanceKm / speedKph) * 60));
}

function getTravelProfiles(distanceKm, carMinutes) {
  return {
    walking: minutesFor(distanceKm, 5),
    cycling: minutesFor(distanceKm, 15),
    bike: minutesFor(distanceKm, 32),
    car: Math.max(1, Math.round(carMinutes)),
  };
}

module.exports = { getTravelProfiles };
