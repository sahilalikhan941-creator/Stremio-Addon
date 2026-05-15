const addon = require('stremio-addon-sdk');
const express = require('express');
const cors = require('cors');
const { getStreams } = require('./lib/scraper');

const app = express();
app.use(cors());

// Addon manifest
const manifest = {
  id: 'com.stremio.uhdmovies',
  version: '1.0.0',
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
  ]
};

// Create addon
const addonInstance = new addon.Addon(manifest);

// Handle stream requests
addonInstance.defineStreamHandler(async (args) => {
  console.log('Stream request for:', args.id);
  
  try {
    const streams = await getStreams(args.id);
    return { streams };
  } catch (error) {
    console.error('Error fetching streams:', error);
    return { streams: [] };
  }
});

// Serve addon
app.get('/manifest.json', (req, res) => {
  res.json(manifest);
});

app.get('/stream/:type/:id.json', async (req, res) => {
  try {
    const { type, id } = req.params;
    if (type !== 'movie') {
      return res.json({ streams: [] });
    }
    
    const streams = await getStreams(id);
    res.json({ streams });
  } catch (error) {
    console.error('Error:', error);
    res.json({ streams: [] });
  }
});

app.use(addon.serveHTTP(addonInstance));

const PORT = process.env.PORT || 7070;
app.listen(PORT, () => {
  console.log(`Stremio UHDMovies addon listening on http://localhost:${PORT}`);
  console.log(`Addon accessible at http://localhost:${PORT}/manifest.json`);
});
