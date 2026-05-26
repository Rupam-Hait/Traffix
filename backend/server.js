const express = require('express');
const cors = require('cors');
const routeRoutes = require('./routes/routeRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigin = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'traffix-routing' });
});

app.use('/api/routes', routeRoutes);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Unable to process the routing request.',
  });
});

app.listen(PORT, () => {
  console.log(`Traffix backend running on port ${PORT}`);
});
