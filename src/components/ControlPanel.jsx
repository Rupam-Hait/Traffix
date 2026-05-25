import { motion } from 'framer-motion';
import { FaPause, FaPlay, FaRedo, FaStepForward } from 'react-icons/fa';
import EmergencyMode from './EmergencyMode';

const algorithms = [
  { id: 'dijkstra', label: 'Dijkstra' },
  { id: 'astar', label: 'A*' },
  { id: 'bfs', label: 'BFS' },
  { id: 'dfs', label: 'DFS' },
];

const panelVariants = {
  hidden: { opacity: 0, x: -26 },
  show: {
    opacity: 1,
    x: 0,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const IconButton = ({ icon, label, onClick, disabled }) => (
  <motion.button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="grid h-11 w-11 place-items-center rounded-md border border-glow bg-bg-secondary/80 text-neon-cyan disabled:cursor-not-allowed disabled:opacity-40"
    whileTap={{ scale: 0.92 }}
    whileHover={!disabled ? { scale: 1.05, boxShadow: '0 0 20px rgba(0,245,255,0.4)' } : undefined}
    title={label}
  >
    {icon}
  </motion.button>
);

export default function ControlPanel({
  nodes,
  source,
  destination,
  algorithm,
  speed,
  isPlaying,
  trafficMode,
  emergencyMode,
  onSourceChange,
  onDestinationChange,
  onAlgorithmChange,
  onSpeedChange,
  onPlay,
  onPause,
  onStep,
  onReset,
  onTrafficModeChange,
  onEmergencyChange,
}) {
  return (
    <motion.aside
      className="z-20 flex w-full flex-col gap-5 rounded-lg border border-glow bg-card p-4 shadow-[0_0_30px_rgba(0,245,255,0.1)] backdrop-blur-2xl lg:w-[330px]"
      variants={panelVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants}>
        <p className="font-display text-xs uppercase tracking-[0.24em] text-neon-cyan">Route Console</p>
        <h1 className="mt-1 font-display text-2xl text-text-primary">Traffix</h1>
      </motion.div>

      <motion.div className="grid gap-3" variants={itemVariants}>
        <label className="grid gap-2 font-mono text-xs text-text-muted">
          Source
          <select
            value={source}
            onChange={(event) => onSourceChange(event.target.value)}
            className="rounded-md border border-glow bg-bg-secondary px-3 py-2 text-text-primary outline-none focus:border-neon-cyan"
          >
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label} ({node.id})
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 font-mono text-xs text-text-muted">
          Destination
          <select
            value={destination}
            onChange={(event) => onDestinationChange(event.target.value)}
            className="rounded-md border border-glow bg-bg-secondary px-3 py-2 text-text-primary outline-none focus:border-neon-purple"
          >
            {nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label} ({node.id})
              </option>
            ))}
          </select>
        </label>
      </motion.div>

      <motion.div className="grid gap-2" variants={itemVariants}>
        <span className="font-mono text-xs text-text-muted">Algorithm</span>
        <div className="grid grid-cols-2 gap-2">
          {algorithms.map((item) => (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => onAlgorithmChange(item.id)}
              className={`rounded-md border px-3 py-2 font-display text-xs ${
                algorithm === item.id
                  ? 'border-neon-cyan bg-neon-cyan/15 text-neon-cyan shadow-neon'
                  : 'border-glow bg-bg-secondary/70 text-text-primary'
              }`}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,245,255,0.4)' }}
            >
              {item.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      <motion.div className="grid gap-3" variants={itemVariants}>
        <div className="flex items-center justify-between font-mono text-xs text-text-muted">
          <span>Slow</span>
          <span className="text-neon-yellow">{speed}ms</span>
          <span>Ludicrous</span>
        </div>
        <input
          type="range"
          min="50"
          max="1000"
          step="25"
          value={speed}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
          className="accent-neon-cyan"
          aria-label="Animation speed"
        />
      </motion.div>

      <motion.div className="flex items-center gap-3" variants={itemVariants}>
        <IconButton icon={<FaPlay />} label="Play" onClick={onPlay} disabled={isPlaying} />
        <IconButton icon={<FaPause />} label="Pause" onClick={onPause} disabled={!isPlaying} />
        <IconButton icon={<FaStepForward />} label="Step" onClick={onStep} />
        <IconButton icon={<FaRedo />} label="Reset" onClick={onReset} />
      </motion.div>

      <motion.div className="grid grid-cols-2 gap-2" variants={itemVariants}>
        {['manual', 'chaos'].map((mode) => (
          <motion.button
            key={mode}
            type="button"
            onClick={() => onTrafficModeChange(mode)}
            className={`rounded-md border px-3 py-2 font-mono text-xs ${
              trafficMode === mode
                ? 'border-neon-yellow bg-neon-yellow/15 text-neon-yellow'
                : 'border-glow bg-bg-secondary/70 text-text-primary'
            }`}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,245,255,0.4)' }}
          >
            {mode === 'manual' ? 'Manual' : 'Random Chaos'}
          </motion.button>
        ))}
      </motion.div>

      <motion.div variants={itemVariants}>
        <EmergencyMode active={emergencyMode} onToggle={onEmergencyChange} />
      </motion.div>
    </motion.aside>
  );
}
