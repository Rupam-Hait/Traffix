import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import NavigationMap from './components/map/NavigationMap';
import SearchPanel from './components/search/SearchPanel';
import TrafficLegend from './components/route/TrafficLegend';
import { calculateRoute } from './services/routeApi';

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629, name: 'India' };

export default function App() {
  const [source, setSource] = useState(null);
  const [destination, setDestination] = useState(null);
  const [mode, setMode] = useState('fastest');
  const [route, setRoute] = useState(null);
  const [isRouting, setIsRouting] = useState(false);
  const [isTrafficRefreshing, setIsTrafficRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastTrafficUpdate, setLastTrafficUpdate] = useState(null);
  const [visualizationSpeed, setVisualizationSpeed] = useState('medium');
  const [visualizationPhase, setVisualizationPhase] = useState('idle');
  const [showRouteToast, setShowRouteToast] = useState(false);

  const mapFocus = useMemo(() => source || destination || DEFAULT_CENTER, [source, destination]);

  useEffect(() => {
    setRoute(null);
    setLastTrafficUpdate(null);
    setVisualizationPhase('idle');
  }, [source?.id, destination?.id]);

  const handleRouteRequest = useCallback(async (nextMode = mode, options = {}) => {
    if (!source || !destination) {
      setError('Choose a source and destination first.');
      return;
    }

    setError('');
    if (options.background) {
      setIsTrafficRefreshing(true);
    } else {
      setRoute(null);
      setVisualizationPhase('calculating');
      setIsRouting(true);
    }

    try {
      const data = await calculateRoute({ source, destination, mode: nextMode });
      setRoute(data);
      setLastTrafficUpdate(new Date());
      
      if (!options.background) {
        setShowRouteToast(true);
        const timer = setTimeout(() => setShowRouteToast(false), 3000);
        return () => clearTimeout(timer);
      }
    } catch (requestError) {
      setError(requestError.message);
      setVisualizationPhase('idle');
    } finally {
      setIsRouting(false);
      setIsTrafficRefreshing(false);
    }
  }, [destination, mode, source]);

  useEffect(() => {
    if (!route || !source || !destination) return undefined;

    const timer = window.setInterval(() => {
      handleRouteRequest(mode, { background: true });
    }, 45000);

    return () => window.clearInterval(timer);
  }, [destination, handleRouteRequest, mode, route, source]);

  async function handleModeChange(nextMode) {
    setMode(nextMode);
    if (source && destination) {
      await handleRouteRequest(nextMode);
    }
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <NavigationMap
        center={mapFocus}
        destination={destination}
        route={route}
        source={source}
        visualizationSpeed={visualizationSpeed}
        onPhaseChange={setVisualizationPhase}
      />

      <SearchPanel
        destination={destination}
        error={error}
        isRouting={isRouting}
        mode={mode}
        onDestinationChange={setDestination}
        onModeChange={handleModeChange}
        onRouteRequest={() => handleRouteRequest()}
        onSourceChange={setSource}
        onSpeedChange={setVisualizationSpeed}
        isTrafficRefreshing={isTrafficRefreshing}
        lastTrafficUpdate={lastTrafficUpdate}
        route={route}
        source={source}
        visualizationPhase={visualizationPhase}
        visualizationSpeed={visualizationSpeed}
      />

      <AnimatePresence>
        {showRouteToast && visualizationPhase === 'complete' && (
          <motion.div
            className="pointer-events-none fixed left-1/2 top-8 z-40 -translate-x-1/2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="glass-panel flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold text-text-primary">
              <motion.span
                className="h-2.5 w-2.5 rounded-full bg-traffic-low"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
              />
              Route found
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {route && visualizationPhase === 'complete' && (
          <motion.div
            className="pointer-events-none fixed bottom-8 left-1/2 z-30 -translate-x-1/2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <TrafficLegend />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
