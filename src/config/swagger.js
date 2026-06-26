const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Space Explorer Dashboard API',
      version: '1.0.0',
      description: `
## Space Explorer Dashboard — REST API

> Developed as part of the **CAPS Operations Committee** Interim Recruitment Task  
> Inspired by the research-grade engineering standards of MIT CSAIL & Stanford HAI.

This API integrates with NASA's open data platform to expose:
- **APOD** — Astronomy Picture of the Day
- **Mars Rover Photos** — filterable by rover, sol, Earth date, and camera
- **NEO** — Near Earth Object feed
- **Favorites** — full CRUD with notes and tags

### Architecture
\`\`\`
Client → Express Router → Controller → Service (Redis Cache) → NASA API / MongoDB
\`\`\`

### Rate Limiting
Each IP is limited to **100 requests per 15 minutes** on all endpoints.

### Caching Strategy
NASA API responses are cached in Redis. TTLs:
- APOD: 24 hours (changes once per day)
- Mars Rover: 1 hour
- NEO: 1 hour
      `,
      contact: {
        name: 'CAPS Tech Tank — Operations Committee',
      },
      license: { name: 'MIT' },
    },
    servers: [
      { url: 'http://localhost:5000/api/v1', description: 'Local Development' },
    ],
    tags: [
      { name: 'APOD', description: 'Astronomy Picture of the Day' },
      { name: 'Mars Rover', description: 'Mars Rover Photos' },
      { name: 'NEO', description: 'Near Earth Objects' },
      { name: 'Favorites', description: 'User Favorites — CRUD' },
      { name: 'Health', description: 'Service health check' },
    ],
    components: {
      schemas: {
        Favorite: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '661f2b...' },
            type: { type: 'string', enum: ['apod', 'mars', 'neo'], example: 'apod' },
            nasaId: { type: 'string', example: '2024-03-15' },
            title: { type: 'string', example: 'Pillars of Creation' },
            url: { type: 'string', example: 'https://apod.nasa.gov/...' },
            notes: { type: 'string', example: 'Stunning nebula shot' },
            tags: { type: 'array', items: { type: 'string' }, example: ['nebula', 'hubble'] },
            metadata: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Something went wrong' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
