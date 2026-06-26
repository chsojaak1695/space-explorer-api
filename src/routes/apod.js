const express = require('express');
const { getApodHandler } = require('../controllers/apodController');

const router = express.Router();

/**
 * @swagger
 * /apod:
 *   get:
 *     tags: [APOD]
 *     summary: Astronomy Picture of the Day
 *     description: |
 *       Returns NASA's APOD for a specific date, or a random set if `count` is provided.
 *       Results are cached in Redis for 24 hours.
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           example: "2024-03-15"
 *         description: YYYY-MM-DD (defaults to today)
 *       - in: query
 *         name: count
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Return N random APODs (mutually exclusive with date)
 *       - in: query
 *         name: thumbs
 *         schema:
 *           type: boolean
 *         description: Include video thumbnail URL when media_type is video
 *     responses:
 *       200:
 *         description: APOD data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     date:
 *                       type: string
 *                     explanation:
 *                       type: string
 *                     url:
 *                       type: string
 *                     hdurl:
 *                       type: string
 *                     media_type:
 *                       type: string
 *                       enum: [image, video]
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       429:
 *         description: NASA API rate limit hit
 */
router.get('/', getApodHandler);

module.exports = router;
