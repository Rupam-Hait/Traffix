const levels = [
  { label: 'Low', className: 'bg-traffic-low' },
  { label: 'Medium', className: 'bg-traffic-medium' },
  { label: 'Heavy', className: 'bg-traffic-heavy' },
];

export default function TrafficLegend() {
  return (
    <div className="glass-panel flex items-center gap-3 rounded-full px-4 py-3">
      {levels.map((level) => (
        <span key={level.label} className="flex items-center gap-2 text-xs font-black text-clay">
          <span className={`h-3 w-3 rounded-full ${level.className}`} />
          {level.label}
        </span>
      ))}
    </div>
  );
}
