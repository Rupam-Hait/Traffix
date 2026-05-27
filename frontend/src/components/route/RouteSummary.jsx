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
      <div className="glass-panel rounded-xl p-4">
        <p className="text-sm font-semibold text-text-secondary">Route details will appear here.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">{route.algorithm}</p>
          <h3 className="mt-1 text-base font-bold text-text-primary">
            {route.mode === 'fastest' ? 'Fastest Route' : 'Shortest Distance'}
          </h3>
        </div>
        <span className="h-9 w-9 rounded-full bg-route-blue flex items-center justify-center text-white flex-shrink-0">
          <FiNavigation size={16} />
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg bg-surface-secondary p-3 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <FiMap size={14} className="text-route-blue" />
            <p className="text-2xl font-bold text-text-primary">{route.metrics.distanceKm} km</p>
          </div>
          <p className="text-xs font-semibold text-text-secondary">Distance</p>
        </div>
        <div className="rounded-lg bg-surface-secondary p-3 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <FiClock size={14} className="text-route-blue" />
            <p className="text-2xl font-bold text-text-primary">{formatMinutes(route.metrics.carMinutes)}</p>
          </div>
          <p className="text-xs font-semibold text-text-secondary">Car ETA</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        {timeLabels.map(([key, label]) => (
          <div key={key} className="rounded-lg bg-surface-secondary px-2 py-2 border border-border">
            <p className="text-xs font-semibold text-text-secondary">{label}</p>
            <p className="text-sm font-bold text-text-primary">{formatMinutes(route.metrics.travelTimes[key])}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2 border border-border">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-secondary">
          <FiActivity size={14} />
          Scanned
        </span>
        <span className="text-sm font-bold text-text-primary">
          {route.metrics.relaxedEdges || route.metrics.visitedNodes || 0} roads
        </span>
      </div>
    </div>
  );
}
