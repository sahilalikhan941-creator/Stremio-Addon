# Stremio UHDMovies Addon

A Stremio addon that provides HTTP streams for movies from the UHDMovies website.

## Features

- 🎬 Search and stream movies from UHDMovies
- 🌐 HTTP streaming support
- 🔍 IMDb ID integration
- ⚡ Fast and lightweight
- 🛠️ Easy to configure and deploy

## Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/sahilalikhan941-creator/Stremio-Addon.git
cd Stremio-Addon
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The addon will be available at `http://localhost:7070/manifest.json`

## Adding to Stremio

1. Open Stremio
2. Go to "Addons" section
3. Click "Install from URL"
4. Enter the addon URL:
   - For local: `http://localhost:7070/manifest.json`
   - For remote: Your deployment URL + `/manifest.json`
5. Click "Install"

## Development

For development with auto-reload:

```bash
npm run dev
```

## API Endpoints

### Get Manifest
```
GET /manifest.json
```

Returns addon metadata and configuration.

### Get Streams
```
GET /stream/movie/{imdbId}.json
```

Returns available streams for a movie.

**Example:**
```
GET /stream/movie/tt1375666.json
```

**Response:**
```json
{
  "streams": [
    {
      "url": "http://stream-url.com/movie.mp4",
      "title": "UHD Movies - Stream 1",
      "quality": "HD",
      "type": "http"
    }
  ]
}
```

## Configuration

You can customize the addon by modifying:

- `manifest.json` - Addon metadata and configuration
- `lib/scraper.js` - Scraping logic and stream extraction
- `server.js` - Server configuration and routing

## Deployment

### Heroku

1. Create a `Procfile`:
```
web: node server.js
```

2. Deploy:
```bash
heroku create your-app-name
git push heroku main
```

### Docker

1. Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 7070
CMD ["npm", "start"]
```

2. Build and run:
```bash
docker build -t stremio-uhdmovies .
docker run -p 7070:7070 stremio-uhdmovies
```

## Troubleshooting

### No streams found
- Ensure the movie exists on UHDMovies
- Try searching with different keywords
- Check your internet connection
- Verify the IMDb ID is correct

### Connection timeout
- Increase timeout values in `lib/scraper.js`
- Check if UHDMovies website is accessible
- Verify your proxy/firewall settings

### Addon not installing
- Ensure the server is running
- Check the manifest URL is correct
- Verify Stremio can reach your server

## Disclaimer

This addon is for educational purposes only. Ensure you have the right to stream content from UHDMovies in your jurisdiction. The developers are not responsible for any misuse.

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## Support

For issues and questions, please open an issue on GitHub.
