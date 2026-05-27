import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { FiChevronUp, FiMapPin, FiNavigation, FiRadio, FiRefreshCw, FiSearch } from 'react-icons/fi';
import { useGeolocation } from '../../hooks/useGeolocation';
import RouteSummary from '../route/RouteSummary';
import SearchBox from './SearchBox';

const modes = [
  { id: 'fastest', label: 'Fastest Route' },
  { id: 'shortest', label: 'Shortest Distance' },
];

export default function SearchPanel({
  destination,
  error,
  isTrafficRefreshing,
  isRouting,
  lastTrafficUpdate,
  mode,
  onDestinationChange,
  onModeChange,
  onRouteRequest,
  onSourceChange,
  onSpeedChange,
  route,
  source,
  visualizationPhase,
  visualizationSpeed,
}) {
  const { detect, isDetecting } = useGeolocation(onSourceChange);
  const [drawerExpanded, setDrawerExpanded] = useState(false);
  const updateLabel = lastTrafficUpdate
    ? lastTrafficUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden lg:fixed lg:left-0 lg:top-0 lg:z-40 lg:h-full lg:w-80 lg:flex lg:flex-col"
        initial={{ x: -320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="glass-panel m-4 flex-1 overflow-y-auto rounded-2xl p-5">
          {/* Logo Area */}
          <div className="mb-6 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-accent-red flex items-center justify-center">
              <span className="text-xs font-bold text-white">T</span>
            </div>
            <div>
              <p className="text-lg font-bold text-text-primary">Traffix</p>
              <p className="text-xs text-text-secondary">Smart navigation</p>
            </div>
          </div>

          {/* Route Planner Section */}
          <div className="mb-5 space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-text-secondary">
              Route Planner
            </h2>
            <p className="text-xl font-bold text-text-primary">Where to?</p>
          </div>

          {/* Input Fields */}
          <div className="mb-4 space-y-3">
            <SearchBox
              icon={<FiMapPin />}
              label="Source"
              onSelect={onSourceChange}
              placeholder="Search pickup point"
              value={source}
            />
            <SearchBox
              icon={<FiNavigation />}
              label="Destination"
              onSelect={onDestinationChange}
              placeholder="Search destination"
              value={destination}
            />
          </div>

          {/* Current Location Button */}
          <motion.button
            type="button"
            onClick={detect}
            className="mb-4 w-full flex items-center justify-center gap-2 rounded-xl bg-surface-secondary px-4 py-3 text-sm font-semibold text-text-primary border border-border transition hover:bg-surface"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiRadio size={16} />
            {isDetecting ? 'Detecting location...' : 'Use Current Location'}
          </motion.button>

          {/* Route Type Toggle */}
          <div className="mb-4 rounded-xl bg-surface-secondary p-2 border border-border">
            <div className="grid grid-cols-2 gap-2">
              {modes.map((item) => (
                <motion.button
                  key={item.id}
                  type="button"
                  onClick={() => onModeChange(item.id)}
                  className={`relative rounded-lg px-3 py-2.5 text-xs font-semibold transition ${
                    mode === item.id ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {mode === item.id && (
                    <motion.span
                      layoutId="mode-pill"
                      className="absolute inset-0 rounded-lg bg-accent-red"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Traffic Mode Selector */}
          <div className="mb-4 rounded-xl bg-surface-secondary p-3 border border-border">
            <p className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-2">
              Traffic Mode
            </p>
            <div className="flex gap-2">
              {['live', 'historical'].map((trafficMode) => (
                <motion.button
                  key={trafficMode}
                  type="button"
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    trafficMode === 'live'
                      ? 'bg-accent-red text-white'
                      : 'bg-surface text-text-secondary border border-border'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {trafficMode === 'live' ? 'Live' : 'Historical'}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Find Route Button */}
          <motion.button
            type="button"
            onClick={onRouteRequest}
            disabled={isRouting || !source || !destination}
            className="mb-4 w-full flex items-center justify-center gap-2 rounded-xl bg-accent-red px-5 py-3 text-sm font-bold text-white transition disabled:opacity-50 hover:shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isRouting ? (
              <span className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  <FiRefreshCw size={16} />
                </motion.span>
                Calculating...
              </span>
            ) : (
              <>
                <FiSearch size={16} />
                Find Route
              </>
            )}
          </motion.button>

          {/* Traffic Update Status */}
          {route && (
            <motion.div
              className="mb-4 rounded-xl bg-surface-secondary px-3 py-2 text-xs font-semibold text-text-secondary border border-border flex items-center justify-between"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <span>
                {isTrafficRefreshing
                  ? 'Updating traffic...'
                  : visualizationPhase === 'complete'
                    ? 'Route active'
                    : 'Optimizing...'}
              </span>
              {updateLabel && <span>{updateLabel}</span>}
            </motion.div>
          )}

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.p
                className="mb-4 rounded-xl bg-surface-secondary px-3 py-2 text-sm font-semibold text-traffic-heavy border border-border"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Route Results */}
          {route && visualizationPhase === 'complete' && (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <RouteSummary route={route} compact />
            </motion.div>
          )}
        </div>
      </motion.aside>

      {/* Mobile Bottom Drawer */}
      <AnimatePresence>
        <motion.div
          className="fixed inset-x-0 bottom-0 z-40 flex flex-col lg:hidden"
          initial={false}
          animate={{ height: drawerExpanded ? '65vh' : '30vh' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <motion.div
            className="glass-panel flex-1 overflow-y-auto rounded-t-2xl p-4 flex flex-col"
            onClick={() => !drawerExpanded && setDrawerExpanded(true)}
          >
            {/* Drawer Handle */}
            <motion.div
              className="mb-3 mx-auto h-1 w-10 rounded-full bg-border"
              animate={{ opacity: drawerExpanded ? 0.5 : 1 }}
            />

            {/* Logo - Collapsed State Only */}
            {!drawerExpanded && (
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-accent-red flex items-center justify-center">
                    <span className="text-xs font-bold text-white">T</span>
                  </div>
                  <p className="font-bold text-text-primary">Traffix</p>
                </div>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDrawerExpanded(!drawerExpanded);
                  }}
                  className="p-1"
                >
                  <FiChevronUp size={20} className={`transition-transform ${drawerExpanded ? 'rotate-180' : ''}`} />
                </motion.button>
              </div>
            )}

            {/* Collapsed State - Inputs Only */}
            {!drawerExpanded && (
              <div className="space-y-2 mb-2">
                <SearchBox
                  icon={<FiMapPin />}
                  label="Source"
                  onSelect={onSourceChange}
                  placeholder="From"
                  value={source}
                />
                <SearchBox
                  icon={<FiNavigation />}
                  label="Destination"
                  onSelect={onDestinationChange}
                  placeholder="To"
                  value={destination}
                />
              </div>
            )}

            {/* Expanded State Content */}
            {drawerExpanded && (
              <motion.div
                className="space-y-4 flex-1 overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold text-text-primary">Route Planner</p>
                    <p className="text-xs text-text-secondary">Set your journey</p>
                  </div>
                  <motion.button
                    onClick={() => setDrawerExpanded(false)}
                    className="p-1"
                  >
                    <FiChevronUp size={20} />
                  </motion.button>
                </div>

                <div className="space-y-3">
                  <SearchBox
                    icon={<FiMapPin />}
                    label="Source"
                    onSelect={onSourceChange}
                    placeholder="Search pickup point"
                    value={source}
                  />
                  <SearchBox
                    icon={<FiNavigation />}
                    label="Destination"
                    onSelect={onDestinationChange}
                    placeholder="Search destination"
                    value={destination}
                  />
                </div>

                <motion.button
                  type="button"
                  onClick={detect}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-surface-secondary px-4 py-2 text-sm font-semibold text-text-primary border border-border"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiRadio size={14} />
                  {isDetecting ? 'Detecting...' : 'Current Location'}
                </motion.button>

                <div className="rounded-lg bg-surface-secondary p-2 border border-border">
                  <div className="grid grid-cols-2 gap-2">
                    {modes.map((item) => (
                      <motion.button
                        key={item.id}
                        type="button"
                        onClick={() => onModeChange(item.id)}
                        className={`relative rounded-lg px-2 py-2 text-xs font-semibold transition ${
                          mode === item.id ? 'text-white' : 'text-text-secondary'
                        }`}
                        whileTap={{ scale: 0.95 }}
                      >
                        {mode === item.id && (
                          <motion.span
                            layoutId="mode-pill-mobile"
                            className="absolute inset-0 rounded-lg bg-accent-red"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                        <span className="relative">{item.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <motion.button
                  type="button"
                  onClick={onRouteRequest}
                  disabled={isRouting || !source || !destination}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent-red px-4 py-3 text-sm font-bold text-white transition disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isRouting ? (
                    <span className="flex items-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      >
                        <FiRefreshCw size={14} />
                      </motion.span>
                      Calculating...
                    </span>
                  ) : (
                    <>
                      <FiSearch size={14} />
                      Find Route
                    </>
                  )}
                </motion.button>

                {route && visualizationPhase === 'complete' && (
                  <motion.div
                    className="space-y-3 pt-2 border-t border-border"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-text-secondary">Route Summary</p>
                    <RouteSummary route={route} compact />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Collapsed State - Current Location Button */}
            {!drawerExpanded && (
              <motion.button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  detect();
                }}
                className="mt-auto w-full flex items-center justify-center gap-2 rounded-lg bg-accent-red px-4 py-2 text-xs font-semibold text-white"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiRadio size={12} />
                {isDetecting ? 'Detecting...' : 'Current Location'}
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
