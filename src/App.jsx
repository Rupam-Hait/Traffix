import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FaDownload, FaRoute, FaVolumeMute, FaVolumeUp } from 'react-icons/fa';
import localforage from 'localforage';
import HomePage from './pages/HomePage';
import ComparePage from './pages/ComparePage';
import Starfield from './components/Starfield';
import SoundEngine, { setMuted, unlockAudio } from './components/SoundEngine';
import useTrafficState from './hooks/useTrafficState';

const SETTINGS_KEY = 'traffix:settings';

function TopNav({ page, onPageChange, muted, onMuteToggle, onInstall, installReady }) {
  return (
    <header className="sticky top-0 z-30 border-b border-glow bg-bg-primary/80 backdrop-blur-2xl">
      <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-5">
        <button type="button" onClick={() => onPageChange('home')} className="flex items-center gap-3 text-left">
          <span className="grid h-11 w-11 place-items-center rounded-md border border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-neon">
            <FaRoute />
          </span>
          <span>
            <span className="block font-display text-xl text-text-primary">Smart Traffic Navigator</span>
            <span className="block font-mono text-xs text-text-muted">DAA algorithm visualization system</span>
          </span>
        </button>
        <nav className="flex items-center gap-2">
          {[
            ['home', 'Home'],
            ['compare', 'Compare'],
          ].map(([id, label]) => (
            <motion.button
              key={id}
              type="button"
              onClick={() => onPageChange(id)}
              className={`rounded-md border px-4 py-2 font-mono text-xs ${
                page === id
                  ? 'border-neon-cyan bg-neon-cyan/15 text-neon-cyan shadow-neon'
                  : 'border-glow bg-bg-secondary/70 text-text-primary'
              }`}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,245,255,0.4)' }}
            >
              {label}
            </motion.button>
          ))}
          <motion.button
            type="button"
            onClick={onMuteToggle}
            aria-label={muted ? 'Unmute sound' : 'Mute sound'}
            className="grid h-10 w-10 place-items-center rounded-md border border-glow bg-bg-secondary/70 text-neon-cyan"
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,245,255,0.4)' }}
            title={muted ? 'Unmute sound' : 'Mute sound'}
          >
            {muted ? <FaVolumeMute /> : <FaVolumeUp />}
          </motion.button>
          <motion.button
            type="button"
            onClick={onInstall}
            disabled={!installReady}
            aria-label="Install PWA"
            className="grid h-10 w-10 place-items-center rounded-md border border-glow bg-bg-secondary/70 text-neon-green disabled:opacity-40"
            whileTap={{ scale: 0.92 }}
            whileHover={installReady ? { scale: 1.05, boxShadow: '0 0 20px rgba(0,255,136,0.35)' } : undefined}
            title="Install PWA"
          >
            <FaDownload />
          </motion.button>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  const [page, setPage] = useState('home');
  const [source, setSource] = useState('A');
  const [destination, setDestination] = useState('O');
  const [algorithm, setAlgorithm] = useState('dijkstra');
  const [speed, setSpeed] = useState(300);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [muted, setMutedState] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const trafficState = useTrafficState();

  useEffect(() => {
    localforage.getItem(SETTINGS_KEY).then((settings) => {
      if (!settings) return;
      setSource(settings.source ?? 'A');
      setDestination(settings.destination ?? 'O');
      setAlgorithm(settings.algorithm ?? 'dijkstra');
      setSpeed(settings.speed ?? 300);
      setEmergencyMode(settings.emergencyMode ?? false);
      setMutedState(settings.muted ?? false);
      setMuted(settings.muted ?? false);
    });
  }, []);

  useEffect(() => {
    localforage.setItem(SETTINGS_KEY, {
      source,
      destination,
      algorithm,
      speed,
      emergencyMode,
      muted,
    });
  }, [source, destination, algorithm, speed, emergencyMode, muted]);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
    if (!next) unlockAudio();
  };

  const installApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const pageProps = {
    source,
    destination,
    algorithm,
    speed,
    emergencyMode,
    trafficState,
    onSourceChange: setSource,
    onDestinationChange: setDestination,
    onAlgorithmChange: setAlgorithm,
    onSpeedChange: setSpeed,
    onEmergencyChange: setEmergencyMode,
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg-primary text-text-primary">
      <Starfield />
      <SoundEngine />
      <TopNav
        page={page}
        onPageChange={setPage}
        muted={muted}
        onMuteToggle={toggleMute}
        onInstall={installApp}
        installReady={Boolean(installPrompt)}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, x: page === 'home' ? -24 : 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: page === 'home' ? 24 : -24 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          {page === 'home' ? <HomePage {...pageProps} /> : <ComparePage {...pageProps} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
