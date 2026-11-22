const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const client = require('prom-client');

const app = express();
app.use(express.json());

client.collectDefaultMetrics();
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status']
});

app.use((req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  const start = Date.now();
  res.setHeader('X-Request-Id', requestId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    httpRequestCounter.inc({ method: req.method, route: req.path, status: res.statusCode });
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'error' : 'info',
      request_id: requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: duration
    }));
  });
  next();
});

const PORT = process.env.PORT || 8000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/craondb';
const APP_VERSION = process.env.APP_VERSION || 'v1';

let dbConnected = false;
mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 })
  .then(() => { dbConnected = true; })
  .catch(err => console.error(JSON.stringify({ level: 'error', msg: 'DB init error', error: err.message })));

const Item = mongoose.model('Item', new mongoose.Schema({ name: String, createdAt: { type: Date, default: Date.now } }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', db: dbConnected ? 'connected' : 'degraded', version: APP_VERSION });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.get('/api/items', async (req, res) => {
  if (APP_VERSION === 'v2') {
    return res.status(500).json({ error: 'Simulated v2 regression failure' });
  }
  if (!dbConnected) return res.status(503).json({ error: 'Database unreachable' });
  const items = await Item.find().limit(20);
  res.json(items);
});

app.post('/api/items', async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unreachable' });
  const item = await Item.create({ name: req.body.name || 'sample-task' });
  res.status(201).json(item);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({ level: 'info', msg: `Backend listening on 0.0.0.0:${PORT}` }));
});
