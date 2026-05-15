const axios = require('axios');
const cheerio = require('cheerio');

const BASE_URL = 'https://uhdmovies.com';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

/**
 * Search for a movie on UHDMovies
 * @param {string} query - Movie title or IMDb ID
 * @returns {Promise<Object>} Movie object with download links
 */
async function searchMovie(query) {
  try {
    const response = await axios.get(`${BASE_URL}/?s=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const firstResult = $('.post-title a').first();
    
    if (firstResult.length === 0) {
      return null;
    }

    return {
      title: firstResult.text(),
      url: firstResult.attr('href')
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
    const response = await axios.get(movieUrl, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: 10000
    });

    const $ = cheerio.load(response.data);
    const streams = [];

    // Look for download links (adjust selectors based on actual website structure)
    $('a[href*="download"], a[href*="streaming"], .download-link').each((index, element) => {
      const $el = $(element);
      const href = $el.attr('href');
      const text = $el.text().trim();

      if (href && (href.includes('http') || href.includes('//'))) {
        streams.push({
          url: href,
          title: text || `Stream ${index + 1}`,
          type: 'http'
        });
      }
    });

    // Also look for embedded players
    $('iframe[src], .player iframe[src]').each((index, element) => {
      const $el = $(element);
      const src = $el.attr('src');
      
      if (src) {
        streams.push({
          url: src,
          title: `Player ${index + 1}`,
          type: 'http'
        });
      }
    });

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
    // Search for the movie using IMDb ID
    const movie = await searchMovie(imdbId);
    
    if (!movie || !movie.url) {
      console.log(`Movie not found for ID: ${imdbId}`);
      return [];
    }

    // Extract streams from the movie page
    const rawStreams = await extractStreams(movie.url);

    // Convert to Stremio format
    const stremioStreams = rawStreams
      .filter(stream => stream.url && stream.url.trim())
      .map((stream, index) => ({
        url: stream.url,
        title: `UHD Movies - ${stream.title}`,
        quality: 'HD',
        type: stream.type || 'http'
      }))
      .slice(0, 5); // Limit to 5 streams

    return stremioStreams;
  } catch (error) {
    console.error('Get streams error:', error.message);
    return [];
  }
}

module.exports = {
  searchMovie,
  extractStreams,
  getStreams
};
