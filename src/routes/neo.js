const express = require('express');
const { getNeoFeedHandler, getNeoByIdHandler } = require('../controllers/neoController');

const router = express.Router();

/**
 * @swagger
 * /neo/feed:
 *   get:
 *     tags: [NEO]
 *     summary: Near Earth Object feed
 *     description: |
 *       Returns asteroids approaching Earth in a date window.
 *       **NASA enforces a maximum 7-day range** — requests exceeding this are rejected with 400.
 *       Optional diameter filters are applied after caching.
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           example: "2024-03-01"
 *         description: YYYY-MM-DD (defaults to today)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           example: "2024-03-07"
 *         description: YYYY-MM-DD, max 7 days after start_date
 *       - in: query
 *         name: min_diameter
 *         schema:
 *           type: number
 *           example: 0.5
 *         description: Minimum estimated diameter in km
 *       - in: query
 *         name: max_diameter
 *         schema:
 *           type: number
 *           example: 2.0
 *         description: Maximum estimated diameter in km
 *     responses:
 *       200:
 *         description: NEO feed
 *       400:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/feed', getNeoFeedHandler);

/**
 * @swagger
 * /neo/{asteroidId}:
 *   get:
 *     tags: [NEO]
 *     summary: Get a specific asteroid by NASA ID
 *     parameters:
 *       - in: path
 *         name: asteroidId
 *         required: true
 *         schema:
 *           type: string
 *           example: "3542519"
 *     responses:
 *       200:
 *         description: Asteroid details
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/:asteroidId', getNeoByIdHandler);

module.exports = router;
