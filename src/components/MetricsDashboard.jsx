import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { FaArrowRight } from 'react-icons/fa';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function Counter({ value, suffix = '' }) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => `${Number(latest).toFixed(value % 1 ? 2 : 0)}${suffix}`);
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const unsubscribe = rounded.on('change', setDisplay);
    return unsubscribe;
  }, [rounded]);

  useEffect(() => {
    const controls = animate(motionValue, Number.isFinite(value) ? value : 0, {
      duration: 0.55,
      ease: 'easeOut',
    });
    return controls.stop;
  }, [motionValue, value]);

  return <span>{display}</span>;
}

export default function MetricsDashboard({ metrics, path = [], title = 'Live Metrics' }) {
  const cards = [
    { label: 'Nodes Visited', value: metrics.nodesVisited || 0 },
    { label: 'Path Cost', value: metrics.cost || 0 },
    { label: 'Execution Steps', value: metrics.steps || 0 },
    { label: 'Algorithm Time', value: metrics.time || 0, suffix: 'ms' },
    { label: 'Path Length', value: Math.max(0, path.length - 1) },
  ];

  return (
    <motion.section
      className="rounded-lg border border-glow bg-card p-4 shadow-[0_0_32px_rgba(0,245,255,0.08)] backdrop-blur-2xl"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm uppercase tracking-[0.18em] text-neon-cyan">{title}</h2>
        <div className="hidden h-px flex-1 bg-gradient-to-r from-neon-cyan/50 to-transparent sm:block" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {cards.map((card) => (
          <motion.div
            key={card.label}
            className="rounded-md border border-glow bg-bg-secondary/70 p-3"
            variants={cardVariants}
            whileHover={{ y: -3, boxShadow: '0 0 20px rgba(0,245,255,0.25)' }}
          >
            <p className="font-mono text-[11px] text-text-muted">{card.label}</p>
            <p className="mt-2 font-display text-xl text-text-primary">
              <Counter value={card.value} suffix={card.suffix} />
            </p>
          </motion.div>
        ))}
      </div>
      <motion.div
        className="mt-4 flex min-h-10 flex-wrap items-center gap-2 rounded-md border border-glow bg-bg-secondary/50 px-3 py-2 font-mono text-sm text-text-primary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {path.length ? (
          path.map((nodeId, index) => (
            <span key={`${nodeId}-${index}`} className="flex items-center gap-2">
              <span className="text-neon-green">{nodeId}</span>
              {index < path.length - 1 && <FaArrowRight className="text-neon-cyan" />}
            </span>
          ))
        ) : (
          <span className="text-text-muted">Route breadcrumb appears after playback reaches the final path.</span>
        )}
      </motion.div>
    </motion.section>
  );
}
