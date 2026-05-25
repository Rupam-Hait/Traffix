import { motion } from 'framer-motion';
import { FaAmbulance } from 'react-icons/fa';

export default function EmergencyMode({ active, onToggle }) {
  return (
    <motion.button
      type="button"
      onClick={() => onToggle(!active)}
      className={`flex w-full items-center justify-between rounded-md border px-4 py-3 font-mono text-sm transition ${
        active
          ? 'border-neon-red bg-neon-red/15 text-neon-red shadow-[0_0_24px_rgba(255,45,85,0.28)]'
          : 'border-glow bg-bg-secondary/70 text-text-primary'
      }`}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(0,245,255,0.4)' }}
    >
      <span className="flex items-center gap-3">
        <motion.span
          animate={
            active
              ? {
                  scale: [1, 1.18, 1],
                  filter: [
                    'drop-shadow(0 0 4px rgba(255,45,85,0.6))',
                    'drop-shadow(0 0 18px rgba(255,45,85,1))',
                    'drop-shadow(0 0 4px rgba(255,45,85,0.6))',
                  ],
                }
              : { scale: 1 }
          }
          transition={{ duration: 0.9, repeat: active ? Infinity : 0 }}
        >
          <FaAmbulance />
        </motion.span>
        Emergency Vehicle
      </span>
      <span>{active ? 'ON' : 'OFF'}</span>
    </motion.button>
  );
}
