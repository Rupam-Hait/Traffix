# Traffix

Traffix is a modern smart traffic navigation web application powered by Dijkstra Algorithm. It uses real OpenStreetMap tiles, real place search through Nominatim, browser geolocation, animated route rendering, and simulated traffic-aware routing.

The algorithm is used behind the scenes to solve a realistic navigation problem.

## Features

- Real map interaction with OpenStreetMap and Leaflet
- Real source and destination search with Nominatim autocomplete
- Use Current Location with the browser geolocation API
- Dijkstra-only routing
- Two route modes: Shortest Distance and Fastest Route
- Simulated traffic levels: Low, Medium, Heavy
- Green, yellow, and red traffic road visualization
- Traffic-aware route weights for fastest routing
- Distance and ETA metrics for walking, cycling, bike, and car
- Smooth animated route reveal on the map
- Responsive UI with a mobile bottom-sheet search panel
- PWA support for installable desktop and mobile usage

## Tech Stack

Frontend:

- React
- Vite
- Tailwind CSS
- Framer Motion
- Leaflet.js

Backend:

- Node.js
- Express.js
- Dijkstra Algorithm

## Project Structure

```text
traffix/
|-- frontend/
|   |-- public/
|   `-- src/
|       |-- animations/
|       |-- components/
|       |-- hooks/
|       |-- pages/
|       |-- services/
|       |-- styles/
|       `-- utils/
|-- backend/
|   |-- algorithms/
|   |-- controllers/
|   |-- routes/
|   |-- services/
|   |-- utils/
|   `-- server.js
`-- package.json
```

## Local Setup

Use Node.js 20.19 or newer.

Install dependencies from the project root:

```bash
npm install
```

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open the frontend at:

```text
http://localhost:5173
```

The backend runs at:

```text
http://localhost:5000
```

## Environment Variables

Frontend:

```env
VITE_API_URL=https://your-render-backend-url.onrender.com
```

Leave `VITE_API_URL` empty locally if you want Vite to proxy `/api` to `http://localhost:5000`.

Backend:

```env
PORT=5000
CORS_ORIGIN=https://your-vercel-frontend-url.vercel.app
```

Use `CORS_ORIGIN=*` during local development if needed.

## How Routing Works

1. The user selects a real source and destination.
2. The backend generates a realistic local road network around those coordinates.
3. Each road edge stores physical distance.
4. Simulated traffic is applied to every edge as Low, Medium, or Heavy and visualized as green, yellow, or red roads.
5. Dijkstra runs on one of two weight models:
   - Shortest Distance: edge weight is distance.
   - Fastest Route: edge weight is estimated travel time after traffic multipliers.
6. The frontend draws the route on the Leaflet map and displays distance plus travel-time estimates.

The traffic simulation updates over time. Traffix refreshes active routes automatically and also provides a manual traffic refresh action.

## Deployment

### Frontend on Vercel

Set the project root to `frontend`.

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

Add this environment variable:

```env
VITE_API_URL=https://your-render-backend-url.onrender.com
```

### Backend on Render

Set the project root to `backend`.

Build command:

```bash
npm install
```

Start command:

```bash
npm start
```

Add this environment variable:

```env
CORS_ORIGIN=https://your-vercel-frontend-url.vercel.app
```

## PWA

Traffix includes a web app manifest and service worker. After deploying over HTTPS, supported browsers can install it on desktop and mobile.

## Notes

Nominatim is a public OpenStreetMap geocoding service. For heavy production traffic, use a dedicated geocoding provider or a self-hosted Nominatim instance.
