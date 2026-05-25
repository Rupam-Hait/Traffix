export const NODES = [
  { id: 'A', label: 'Central Station', x: 400, y: 300 },
  { id: 'B', label: 'City Hospital', x: 200, y: 150 },
  { id: 'C', label: 'Tech Park', x: 600, y: 150 },
  { id: 'D', label: 'Old Market', x: 150, y: 350 },
  { id: 'E', label: 'University', x: 350, y: 100 },
  { id: 'F', label: 'Airport', x: 700, y: 300 },
  { id: 'G', label: 'Shopping Mall', x: 550, y: 450 },
  { id: 'H', label: 'Police HQ', x: 250, y: 480 },
  { id: 'I', label: 'Sports Complex', x: 450, y: 520 },
  { id: 'J', label: 'Power Plant', x: 680, y: 480 },
  { id: 'K', label: 'Riverside Park', x: 100, y: 500 },
  { id: 'L', label: 'North Gate', x: 400, y: 30 },
  { id: 'M', label: 'West Colony', x: 50, y: 250 },
  { id: 'N', label: 'East Harbor', x: 750, y: 150 },
  { id: 'O', label: 'South Bridge', x: 400, y: 580 },
];

export const EDGES = [
  { from: 'A', to: 'B', weight: 5 },
  { from: 'A', to: 'C', weight: 4 },
  { from: 'A', to: 'D', weight: 6 },
  { from: 'A', to: 'G', weight: 3 },
  { from: 'A', to: 'H', weight: 7 },
  { from: 'B', to: 'E', weight: 3 },
  { from: 'B', to: 'D', weight: 4 },
  { from: 'B', to: 'M', weight: 5 },
  { from: 'C', to: 'E', weight: 2 },
  { from: 'C', to: 'F', weight: 5 },
  { from: 'C', to: 'N', weight: 4 },
  { from: 'D', to: 'K', weight: 3 },
  { from: 'D', to: 'M', weight: 4 },
  { from: 'E', to: 'L', weight: 2 },
  { from: 'F', to: 'J', weight: 3 },
  { from: 'F', to: 'N', weight: 2 },
  { from: 'G', to: 'I', weight: 2 },
  { from: 'G', to: 'J', weight: 4 },
  { from: 'H', to: 'I', weight: 2 },
  { from: 'H', to: 'K', weight: 3 },
  { from: 'I', to: 'O', weight: 2 },
  { from: 'J', to: 'O', weight: 3 },
  { from: 'K', to: 'O', weight: 4 },
  { from: 'L', to: 'N', weight: 5 },
  { from: 'M', to: 'K', weight: 3 },
];

export const edgeKey = (from, to) => `${from}-${to}`;

export const getTrafficMultiplier = (trafficMultipliers, from, to) =>
  trafficMultipliers[edgeKey(from, to)] ?? trafficMultipliers[edgeKey(to, from)] ?? 1;

export const getEffectiveWeight = (edge, trafficMultipliers) =>
  edge.weight * getTrafficMultiplier(trafficMultipliers, edge.from, edge.to);
