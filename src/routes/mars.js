const express = require('express');
const { getMarsPhotosHandler, getRoverManifestHandler } = require('../controllers/marsController');

const router = express.Router();

/**
 * @swagger
 * /mars/photos:
 *   get:
 *     tags: [Mars Rover]
 *     summary: Fetch Mars Rover photos
 *     description: |
 *       Returns photos from a Mars rover for a given sol or Earth date.
 *       Results are cached for 1 hour. An empty photos array for a valid sol is a legitimate response.
 *     parameters:
 *       - in: query
 *         name: rover
 *         schema:
 *           type: string
 *           enum: [curiosity, opportunity, spirit, perseverance]
 *           default: curiosity
 *       - in: query
 *         name: sol
 *         schema:
 *           type: integer
 *           minimum: 0
 *           example: 1000
 *         description: Martian sol (day) number
 *       - in: query
 *         name: earth_date
 *         schema:
 *           type: string
 *           example: "2023-06-10"
 *         description: YYYY-MM-DD (alternative to sol)
 *       - in: query
 *         name: camera
 *         schema:
 *           type: string
 *           example: NAVCAM
 *         description: Camera abbreviation (rover-specific)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *     responses:
 *       200:
 *         description: Photo results
 *       400:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/photos', getMarsPhotosHandler);

/**
 * @swagger
 * /mars/manifests/{rover}:
 *   get:
 *     tags: [Mars Rover]
 *     summary: Get rover mission manifest
 *     parameters:
 *       - in: path
 *         name: rover
 *         required: true
 *         schema:
 *           type: string
 *           enum: [curiosity, opportunity, spirit, perseverance]
 *     responses:
 *       200:
 *         description: Rover manifest with mission stats
 *       400:
 *         $ref: '#/components/schemas/Error'
 */
router.get('/manifests/:rover', getRoverManifestHandler);

module.exports = router;
