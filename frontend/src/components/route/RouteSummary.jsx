import { motion } from 'framer-motion';
import { FiActivity, FiClock, FiMap } from 'react-icons/fi';
import { FaBicycle, FaCar, FaMotorcycle, FaWalking } from 'react-icons/fa';

const timeLabels = [
  ['walking', 'Walk'],
  ['cycling', 'Cycle'],
  ['bike', 'Bike'],
  ['car', 'Car'],
];

const modeConfig = {
  walking: {
    label: 'Walk',
    icon: FaWalking,
    color: '#ffffff',
    activeText: '#111111',
    bgColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    glowColor: 'rgba(255, 255, 255, 0.3)',
  },
  cycling: {
    label: 'Cycle',
    icon: FaBicycle,
    color: '#00e5ff',
    activeText: '#ffffff',
    bgColor: 'rgba(0, 229, 255, 0.1)',
    borderColor: 'rgba(0, 229, 255, 0.2)',
    glowColor: 'rgba(0, 229, 255, 0.3)',
  },
  bike: {
    label: 'Bike',
    icon: FaMotorcycle,
    color: '#ff8c00',
    activeText: '#ffffff',
    bgColor: 'rgba(255, 140, 0, 0.1)',
    borderColor: 'rgba(255, 140, 0, 0.2)',
    glowColor: 'rgba(255, 140, 0, 0.3)',
  },
  car: {
    label: 'Car',
    icon: FaCar,
    color: '#2f8fed',
    activeText: '#ffffff',
    bgColor: 'rgba(47, 143, 237, 0.1)',
    borderColor: 'rgba(47, 143, 237, 0.2)',
    glowColor: 'rgba(47, 143, 237, 0.3)',
  },
};

function formatMinutes(minutes) {
  if (!minutes) return '--';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

export default function RouteSummary({
  route,
  activeMode = 'car',
  onTransportModeChange,
  isModeAvailable,
  compact = false,
}) {
  if (!route) {
    if (compact) return null;
    return (
      <div className="glass-panel rounded-xl p-4">
        <p className="text-sm font-semibold text-text-secondary">Route details will appear here.</p>
      </div>
    );
  }

  // Get travel times - prefer the metric from the current mode's route
  const getTravelTime = (modeKey) => {
    const routeKey = modeKey === 'walking' || modeKey === 'cycling' ? 'freeRoute' : 'trafficRoute';
    const modeRoute = route[routeKey] || route;

    if (modeRoute.metrics?.travelTimes?.[modeKey] !== undefined) {
      return modeRoute.metrics.travelTimes[modeKey];
    }
    if (route.travelTimes?.[routeKey === 'freeRoute' ? 'free' : 'traffic']?.[modeKey] !== undefined) {
      return route.travelTimes[routeKey === 'freeRoute' ? 'free' : 'traffic'][modeKey];
    }
    if (route.metrics?.travelTimes?.[modeKey] !== undefined) {
      return route.metrics.travelTimes[modeKey];
    }
    return null;
  };

  const getDistance = () => {
    const routeKey = activeMode === 'walking' || activeMode === 'cycling' ? 'freeRoute' : 'trafficRoute';
    const modeRoute = route[routeKey] || route;
    return modeRoute.metrics?.distanceKm ?? 0;
  };

  const activeModeTravelTime = getTravelTime(activeMode);
  const distance = getDistance();
  const activeRoute = route[activeMode === 'walking' || activeMode === 'cycling' ? 'freeRoute' : 'trafficRoute'] || route;
  const config = modeConfig[activeMode] || modeConfig.car;

  return (
    <div className="glass-panel rounded-xl p-4">
      {/* Transport Mode Buttons */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-2">
          Transport Mode
        </p>
        <div className="grid grid-cols-4 gap-2">
          {timeLabels.map(([modeKey, label]) => {
            const modeInfo = modeConfig[modeKey];
            const isActive = modeKey === activeMode;
            const isDisabled = isModeAvailable === false && (modeKey === 'walking' || modeKey === 'cycling');
            const Icon = modeInfo.icon;

            return (
              <motion.button
                key={modeKey}
                onClick={() => !isDisabled && onTransportModeChange?.(modeKey)}
                disabled={isDisabled}
                aria-pressed={isActive}
                className="relative overflow-hidden rounded-full bg-surface transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white/40"
                whileTap={!isDisabled ? { scale: 0.98 } : {}}
                title={isDisabled ? 'No walkable route found' : label}
              >
                <div
                  className={`relative z-10 flex min-h-[66px] flex-col items-center justify-center gap-1.5 px-2 py-3 transition-all duration-200 ${
                    isDisabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={{
                    backgroundColor: isActive ? modeInfo.color : 'rgba(20, 20, 20, 0.95)',
                    border: `1.5px solid ${isActive ? modeInfo.color : 'rgba(255, 255, 255, 0.1)'}`,
                    boxShadow: isActive ? `0 0 16px ${modeInfo.glowColor}` : 'none',
                  }}
                >
                  <Icon
                    size={18}
                    style={{
                      color: isActive ? modeInfo.activeText : '#999',
                    }}
                  />
                  <span
                    className="text-xs font-bold"
                    style={{
                      color: isActive ? modeInfo.activeText : '#999',
                    }}
                  >
                    {label}
                  </span>
                </div>

                {isActive && (
                  <motion.div
                    layoutId="mode-glow"
                    className="absolute inset-0 rounded-lg opacity-30 blur-md"
                    style={{
                      backgroundColor: config.glowColor,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Primary Stats - Active Mode */}
      <motion.div
        key={activeMode}
        className="mb-3 grid grid-cols-2 gap-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="rounded-lg p-3 border"
          style={{
            backgroundColor: modeConfig[activeMode].bgColor,
            borderColor: modeConfig[activeMode].borderColor,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <FiMap size={14} style={{ color: config.color }} />
            <p className="text-2xl font-bold text-text-primary">{distance} km</p>
          </div>
          <p className="text-xs font-semibold text-text-secondary">Distance</p>
        </div>

        <div
          className="rounded-lg p-3 border"
          style={{
            backgroundColor: modeConfig[activeMode].bgColor,
            borderColor: modeConfig[activeMode].borderColor,
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <FiClock size={14} style={{ color: config.color }} />
            <p className="text-2xl font-bold text-text-primary">{formatMinutes(activeModeTravelTime)}</p>
          </div>
          <p className="text-xs font-semibold text-text-secondary">{config.label} ETA</p>
        </div>
      </motion.div>

      {/* Divider */}
      <div className="mb-3 h-px bg-border" />

      {/* Secondary Stats - All Modes */}
      <div className="mb-3">
        <p className="text-xs font-semibold text-text-secondary mb-2 opacity-70">All Modes</p>
        <div className="grid grid-cols-2 gap-2">
          {timeLabels.map(([key, label]) => (
            <div
              key={key}
              className="rounded-lg bg-surface-secondary px-2 py-2 border border-border opacity-70"
            >
              <p className="text-xs font-semibold text-text-secondary">{label}</p>
              <p className="text-sm font-bold text-text-primary">{formatMinutes(getTravelTime(key))}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2 border border-border opacity-70">
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-text-secondary">
          <FiActivity size={14} />
          Scanned
        </span>
        <span className="text-sm font-bold text-text-primary">
          {activeRoute.metrics?.relaxedEdges || activeRoute.metrics?.visitedNodes || 0} roads
        </span>
      </div>
    </div>
  );
}
