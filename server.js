const express = require('express');
const cors = require('cors');
const { getStreams, searchMovie } = require('./lib/scraper');

const app = express();
app.use(cors());
app.use(express.json());

// Addon manifest
const manifest = {
  id: 'com.stremio.uhdmovies',
  version: '1.0.1',
  name: 'UHD Movies',
  description: 'Stream HD movies from UHDMovies',
  types: ['movie'],
  catalogs: [],
  resources: [
    {
      name: 'stream',
      types: ['movie'],
      idPrefixes: ['tt']
    }
  ],
  contactEmail: 'support@example.com'
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve addon manifest
app.get('/manifest.json', (req, res) => {
  console.log('Manifest requested');
  res.json(manifest);
});

// Stream endpoint - Direct HTTP endpoint
app.get('/stream/:type/:id.json', async (req, res) => {
  try {
    const { type, id } = req.params;
    
    console.log(`Stream request - Type: ${type}, ID: ${id}`);
    
    if (type !== 'movie') {
      return res.json({ streams: [] });
    }
    
    const streams = await getStreams(id);
    console.log(`Returning ${streams.length} streams for ${id}`);
    
    res.json({ streams });
  } catch (error) {
    console.error('Stream endpoint error:', error);
    res.status(500).json({ streams: [], error: error.message });
  }
});

// Search endpoint (optional)
app.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }
    
    console.log(`Search request: ${query}`);
    const movie = await searchMovie(query);
    
    if (!movie) {
      return res.json({ movie: null });
    }
    
    res.json({ movie });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: manifest.name,
    version: manifest.version,
    endpoints: {
      manifest: '/manifest.json',
      health: '/health',
      stream: '/stream/{type}/{id}.json',
      search: '/search'
    }
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 7070;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Stremio UHDMovies Addon Server       ║
║   Version: ${manifest.version}                        ║
╠════════════════════════════════════════╣
║  Running on: http://localhost:${PORT}     ║
║  Manifest: http://localhost:${PORT}/manifest.json ║
║  Health: http://localhost:${PORT}/health     ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
