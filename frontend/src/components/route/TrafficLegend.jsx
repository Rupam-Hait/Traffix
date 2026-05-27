import { motion } from 'framer-motion';

const levels = [
  { label: 'Low', className: 'bg-traffic-low' },
  { label: 'Medium', className: 'bg-traffic-medium' },
  { label: 'High', className: 'bg-traffic-heavy' },
];

export default function TrafficLegend() {
  return (
    <div className="glass-panel flex items-center gap-4 rounded-full px-5 py-3">
      {levels.map((level, index) => (
        <motion.div
          key={level.label}
          className="flex items-center gap-2"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
        >
          <motion.span
            className={`h-2.5 w-2.5 rounded-full ${level.className}`}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
          />
          <span className="text-xs font-semibold text-text-secondary">{level.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
