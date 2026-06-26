const axios = require('axios');
const logger = require('../utils/logger');

const NASA_BASE = 'https://api.nasa.gov';

const nasaClient = axios.create({
  baseURL: NASA_BASE,
  timeout: 15000,
  params: {
    api_key: process.env.NASA_API_KEY || 'DEMO_KEY',
  },
});

// Response interceptor — handle NASA-specific errors gracefully
nasaClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 429) {
        logger.warn('NASA API rate limit hit', { url: error.config.url });
        const err = new Error('NASA API rate limit exceeded. Please try again later.');
        err.statusCode = 429;
        return Promise.reject(err);
      }

      if (status === 400) {
        const msg = data?.error?.message || data?.msg || 'Invalid request to NASA API';
        const err = new Error(msg);
        err.statusCode = 400;
        return Promise.reject(err);
      }

      if (status === 404) {
        const err = new Error('Requested NASA resource not found');
        err.statusCode = 404;
        return Promise.reject(err);
      }
    }

    if (error.code === 'ECONNABORTED') {
      const err = new Error('NASA API request timed out');
      err.statusCode = 504;
      return Promise.reject(err);
    }

    return Promise.reject(error);
  }
);

module.exports = nasaClient;
