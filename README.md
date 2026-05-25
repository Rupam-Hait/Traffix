# 🚦 Smart Traffic Navigation & Algorithm Visualization System

> A futuristic, cyberpunk-inspired interactive system for visualizing graph pathfinding algorithms in a simulated smart city. Built as a DAA (Design and Analysis of Algorithms) mini project.

---

## 📸 Features

- 🗺️ Interactive city graph with 15 nodes and 25 edges
- ⚡ Real-time algorithm visualization: Dijkstra, A*, BFS, DFS, Floyd-Warshall
- 🚗 Dynamic traffic simulation with congestion controls
- 📊 Side-by-side algorithm comparison dashboard
- 🚨 Emergency vehicle priority routing mode
- 🎵 Sci-fi audio feedback (Tone.js)
- 📱 PWA — installable on mobile & desktop
- 🌌 Cyberpunk UI with Framer Motion animations

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (CRA) |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Graph Rendering | D3.js + SVG |
| Audio | Tone.js |
| Storage | localforage |
| PWA | Workbox |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm v9+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/traffix.git
cd traffix

# Install dependencies
npm install

# Start development server
npm start
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
```

Serve the `build/` folder with any static host (Vercel, Netlify, GitHub Pages).

### Install as PWA

- **Desktop (Chrome)**: Click the install icon in the address bar
- **Mobile (Android)**: Tap browser menu → "Add to Home Screen"
- **iOS Safari**: Tap Share → "Add to Home Screen"

---

## 🎮 How to Use

### Basic Navigation

1. Click any node on the graph to set it as **Source** (glows cyan)
2. Click another node to set **Destination** (glows purple)
3. Select an algorithm from the control panel
4. Hit **▶ Play** to watch the algorithm run step by step

### Traffic Simulation

- Open the **Traffic Panel** (bottom right)
- Drag sliders to increase congestion on specific roads
- Hit **Random Chaos** to generate a city-wide traffic jam
- Watch the route change dynamically

### Algorithm Comparison

- Go to the **Compare** page
- Both Dijkstra and A* run simultaneously on the same graph
- See which finds the path faster and with fewer node visits

### Emergency Mode

- Toggle the 🚨 **Emergency** switch
- The algorithm will prioritize the fastest possible route ignoring traffic
- Path glows red to indicate emergency routing

### Speed Control

- Use the speed slider: **Slow** (1000ms/step) → **Ludicrous** (50ms/step)
- Use **Step** button to advance one frame at a time (great for presentations)

---

## 🧠 Algorithms Explained

| Algorithm | Best For | Time Complexity | Traffic-Aware |
|---|---|---|---|
| Dijkstra | Guaranteed shortest path | O((V+E) log V) | ✅ |
| A* | Faster with heuristic | O(E) best case | ✅ |
| BFS | Unweighted traversal demo | O(V+E) | ❌ |
| DFS | Educational comparison | O(V+E) | ❌ |
| Floyd-Warshall | All-pairs shortest paths | O(V³) | ✅ |

---

## 📁 Project Structure

```text
src/
├── algorithms/          # Pure JS algorithm implementations
├── components/          # React UI components
├── data/                # City graph data (nodes + edges)
├── hooks/               # Custom React hooks
└── pages/               # Page-level components
```

---

## 🎓 Academic Context

This project was built for the Design and Analysis of Algorithms (DAA) course. It demonstrates:

- Graph representation (adjacency list)
- Weighted shortest path algorithms
- Heuristic search (A*)
- Algorithm complexity comparison
- Real-world problem modeling

---

## 👨‍💻 Author

Built with 🔥 using React, Framer Motion, D3.js, and way too much caffeine.

---

## 📄 License

MIT License
