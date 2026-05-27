import { FiActivity, FiClock, FiMap, FiNavigation } from 'react-icons/fi';

const timeLabels = [
  ['walking', 'Walking'],
  ['cycling', 'Cycling'],
  ['bike', 'Bike'],
  ['car', 'Car'],
];

function formatMinutes(minutes) {
  if (!minutes) return '--';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

export default function RouteSummary({ route, compact = false }) {
  if (!route) {
    if (compact) return null;
    return (
      <div className="glass-panel rounded-[28px] p-5">
        <p className="text-sm font-black text-clay">Route details will appear here.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-[28px] p-5 shadow-glass">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-clay/65">{route.algorithm}</p>
          <h3 className="mt-1 text-xl font-black text-clay">
            {route.mode === 'fastest' ? 'Fastest Route' : 'Shortest Distance'}
          </h3>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-sage text-ivory">
          <FiNavigation />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-ivory/80 p-4 shadow-panel">
          <FiMap className="text-lg" />
          <p className="mt-3 text-2xl font-black">{route.metrics.distanceKm} km</p>
          <p className="text-xs font-bold text-clay/65">Distance</p>
        </div>
        <div className="rounded-3xl bg-ivory/80 p-4 shadow-panel">
          <FiClock className="text-lg" />
          <p className="mt-3 text-2xl font-black">{formatMinutes(route.metrics.carMinutes)}</p>
          <p className="text-xs font-bold text-clay/65">Car ETA</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {timeLabels.map(([key, label]) => (
          <div key={key} className="rounded-2xl bg-linen/75 px-3 py-3">
            <p className="text-xs font-bold text-clay/60">{label}</p>
            <p className="text-sm font-black text-clay">{formatMinutes(route.metrics.travelTimes[key])}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl bg-mint/80 px-4 py-3">
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-clay/70">
          <FiActivity />
          Scanned
        </span>
        <span className="text-sm font-black text-clay">
          {route.metrics.relaxedEdges || route.metrics.visitedNodes || 0} roads
        </span>
      </div>
    </div>
  );
}
