import { AnimatePresence, motion } from 'framer-motion';
import { FaBolt, FaSlidersH, FaTimes } from 'react-icons/fa';
import { edgeKey } from '../data/cityGraph';

const trafficDot = (value) => {
  if (value >= 2.35) return '#ff2d55';
  if (value >= 1.55) return '#ffcc00';
  return '#00ff88';
};

export default function TrafficControls({
  edges,
  trafficMultipliers,
  onTrafficChange,
  onRandomize,
  onClear,
  open,
  onToggle,
}) {
  return (
    <>
      <motion.button
        type="button"
        onClick={onToggle}
        className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full border border-neon-cyan bg-bg-secondary text-neon-cyan shadow-neon"
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.08, boxShadow: '0 0 20px rgba(0,245,255,0.4)' }}
        aria-label="Toggle traffic controls"
      >
        {open ? <FaTimes /> : <FaSlidersH />}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.aside
            className="fixed bottom-24 right-4 z-30 max-h-[72vh] w-[min(390px,calc(100vw-32px))] overflow-hidden rounded-lg border border-glow bg-card shadow-[0_0_35px_rgba(0,245,255,0.16)] backdrop-blur-2xl"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            <div className="flex items-center justify-between border-b border-glow p-4">
              <h2 className="font-display text-sm uppercase tracking-[0.18em] text-neon-cyan">Traffic Matrix</h2>
              <FaBolt className="text-neon-yellow" />
            </div>
            <div className="grid max-h-[46vh] gap-3 overflow-y-auto p-4">
              {edges.map((edge) => {
                const key = edgeKey(edge.from, edge.to);
                const value = trafficMultipliers[key] ?? 1;
                const color = trafficDot(value);
                return (
                  <motion.label
                    key={key}
                    className="grid gap-2 rounded-md border border-glow bg-bg-secondary/70 p-3 font-mono text-xs text-text-primary"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <motion.span
                          className="h-2.5 w-2.5 rounded-full"
                          animate={{ backgroundColor: color, boxShadow: `0 0 14px ${color}` }}
                        />
                        {edge.from} -> {edge.to}
                      </span>
                      <span style={{ color }}>{value.toFixed(2)}x</span>
                    </span>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={value}
                      onChange={(event) => onTrafficChange(key, Number(event.target.value))}
                      className="accent-neon-cyan"
                      aria-label={`Traffic multiplier for ${edge.from} to ${edge.to}`}
                    />
                  </motion.label>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-glow p-4">
              <motion.button
                type="button"
                onClick={onRandomize}
                className="rounded-md border border-neon-yellow bg-neon-yellow/10 px-3 py-2 font-mono text-xs text-neon-yellow"
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(255,204,0,0.35)' }}
              >
                Generate Random Traffic
              </motion.button>
              <motion.button
                type="button"
                onClick={onClear}
                className="rounded-md border border-neon-green bg-neon-green/10 px-3 py-2 font-mono text-xs text-neon-green"
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(0,255,136,0.35)' }}
              >
                Clear All Traffic
              </motion.button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
