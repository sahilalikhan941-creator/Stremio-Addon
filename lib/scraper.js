const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://uhdmovies.com';

// Enhanced headers to mimic real browser
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none'
};

// Create axios instance with timeout and retry logic
const client = axios.create({
  timeout: 15000,
  headers,
  validateStatus: () => true // Don't throw on any status code
});

/**
 * Search for a movie on UHDMovies
 * @param {string} query - Movie title or IMDb ID
 * @returns {Promise<Object>} Movie object with download links
 */
async function searchMovie(query) {
  try {
    console.log(`Searching for: ${query}`);
    
    const response = await client.get(`${BASE_URL}/?s=${encodeURIComponent(query)}`);
    
    if (response.status !== 200) {
      console.error(`Search returned status ${response.status}`);
      return null;
    }

    const $ = cheerio.load(response.data);
    
    // Try multiple selectors for finding movie links
    const selectors = [
      '.post-title a',
      'h3 a',
      'a.post-link',
      '.entry-title a',
      'h2 a'
    ];

    let firstResult = null;
    for (let selector of selectors) {
      firstResult = $(selector).first();
      if (firstResult.length > 0) {
        console.log(`Found result using selector: ${selector}`);
        break;
      }
    }
    
    if (!firstResult || firstResult.length === 0) {
      console.log('No movie results found');
      return null;
    }

    const movieUrl = firstResult.attr('href');
    const title = firstResult.text().trim();

    if (!movieUrl) {
      return null;
    }

    return {
      title,
      url: movieUrl
    };
  } catch (error) {
    console.error('Search error:', error.message);
    return null;
  }
}

/**
 * Extract stream URLs from movie page
 * @param {string} movieUrl - URL to the movie page
 * @returns {Promise<Array>} Array of stream objects
 */
async function extractStreams(movieUrl) {
  try {
    console.log(`Extracting streams from: ${movieUrl}`);
    
    const response = await client.get(movieUrl);
    
    if (response.status !== 200) {
      console.error(`Movie page returned status ${response.status}`);
      return [];
    }

    const $ = cheerio.load(response.data);
    const streams = [];

    // Look for download links - try multiple patterns
    const linkSelectors = [
      'a[href*="download"]',
      'a[href*="streaming"]',
      'a[href*="play"]',
      '.download-link',
      '.stream-link',
      'a.btn-download'
    ];

    linkSelectors.forEach(selector => {
      $(selector).each((index, element) => {
        const $el = $(element);
        const href = $el.attr('href');
        const text = $el.text().trim();

        if (href && (href.startsWith('http') || href.startsWith('//'))) {
          // Avoid duplicates
          if (!streams.find(s => s.url === href)) {
            streams.push({
              url: href,
              title: text || `Stream ${streams.length + 1}`,
              type: 'http'
            });
          }
        }
      });
    });

    // Look for embedded players (iframe sources)
    $('iframe[src]').each((index, element) => {
      const $el = $(element);
      const src = $el.attr('src');
      
      if (src && (src.startsWith('http') || src.startsWith('//'))) {
        if (!streams.find(s => s.url === src)) {
          streams.push({
            url: src,
            title: `Stream ${streams.length + 1}`,
            type: 'http'
          });
        }
      }
    });

    // Look for data attributes or JavaScript variables
    const scriptContent = $('script').html() || '';
    
    // Look for common streaming patterns in scripts
    const urlPatterns = [
      /https?:\/\/[^\s"'<>]+\.mp4/gi,
      /https?:\/\/[^\s"'<>]+/gi
    ];

    urlPatterns.forEach(pattern => {
      const matches = scriptContent.match(pattern) || [];
      matches.forEach(url => {
        if (url && !streams.find(s => s.url === url) && url.length < 500) {
          streams.push({
            url: url,
            title: `Stream ${streams.length + 1}`,
            type: 'http'
          });
        }
      });
    });

    console.log(`Found ${streams.length} streams`);
    return streams;
  } catch (error) {
    console.error('Extract streams error:', error.message);
    return [];
  }
}

/**
 * Get streams for a specific movie ID
 * @param {string} imdbId - IMDb ID (e.g., 'tt1234567')
 * @returns {Promise<Array>} Array of Stremio stream objects
 */
async function getStreams(imdbId) {
  try {
    console.log(`Getting streams for IMDb ID: ${imdbId}`);
    
    // Search for the movie using IMDb ID
    const movie = await searchMovie(imdbId);
    
    if (!movie || !movie.url) {
      console.log(`Movie not found for ID: ${imdbId}`);
      return [];
    }

    console.log(`Found movie: ${movie.title} at ${movie.url}`);

    // Extract streams from the movie page
    const rawStreams = await extractStreams(movie.url);

    if (rawStreams.length === 0) {
      console.log('No streams found for this movie');
      return [];
    }

    // Convert to Stremio format
    const stremioStreams = rawStreams
      .filter(stream => stream.url && stream.url.trim() && stream.url.length < 500)
      .map((stream, index) => ({
        url: stream.url,
        title: `UHD Movies - ${stream.title}`,
        quality: 'HD',
        type: stream.type || 'http',
        sources: ['UHDMovies']
      }))
      .slice(0, 10); // Limit to 10 streams

    console.log(`Returning ${stremioStreams.length} Stremio streams`);
    return stremioStreams;
  } catch (error) {
    console.error('Get streams error:', error.message);
    return [];
  }
}

/**
 * Get movie info by title (for catalog)
 */
async function getMovieByTitle(title) {
  try {
    const movie = await searchMovie(title);
    return movie;
  } catch (error) {
    console.error('Get movie by title error:', error.message);
    return null;
  }
}

module.exports = {
  searchMovie,
  extractStreams,
  getStreams,
  getMovieByTitle
};
