const marsService = require('../src/services/marsService');

jest.mock('../src/config/nasaClient', () => ({ get: jest.fn() }));
jest.mock('../src/config/redis', () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
}));

const nasaClient = require('../src/config/nasaClient');

const emptyPhotosResponse = { data: { photos: [] } };
const photosResponse = {
  data: {
    photos: [
      { id: 1, img_src: 'https://mars.nasa.gov/photo1.jpg', sol: 1000, camera: { name: 'NAVCAM' }, rover: { name: 'Curiosity' } },
    ],
  },
};

describe('Mars Rover Service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('Parameter validation', () => {
    it('rejects invalid rover names', async () => {
      await expect(
        marsService.getMarsPhotos({ rover: 'fakerobot', sol: 100 })
      ).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('Invalid rover') });
    });

    it('requires sol or earth_date', async () => {
      await expect(
        marsService.getMarsPhotos({ rover: 'curiosity' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects negative sol', async () => {
      await expect(
        marsService.getMarsPhotos({ rover: 'curiosity', sol: -5 })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects invalid camera for rover', async () => {
      await expect(
        marsService.getMarsPhotos({ rover: 'curiosity', sol: 1000, camera: 'PANCAM' })
      ).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('Invalid camera') });
    });
  });

  describe('Empty photo results', () => {
    it('returns empty array gracefully for a valid sol with no photos', async () => {
      nasaClient.get.mockResolvedValue(emptyPhotosResponse);
      const result = await marsService.getMarsPhotos({ rover: 'curiosity', sol: 9999 });
      expect(result.photos).toHaveLength(0);
      expect(result.total_photos).toBe(0);
    });
  });

  describe('Successful photo fetch', () => {
    it('returns normalized photo result', async () => {
      nasaClient.get.mockResolvedValue(photosResponse);
      const result = await marsService.getMarsPhotos({ rover: 'curiosity', sol: 1000 });
      expect(result.rover).toBe('curiosity');
      expect(result.total_photos).toBe(1);
      expect(result.photos[0].id).toBe(1);
    });

    it('accepts perseverance as a valid rover', async () => {
      nasaClient.get.mockResolvedValue(photosResponse);
      await expect(
        marsService.getMarsPhotos({ rover: 'perseverance', sol: 100 })
      ).resolves.toBeDefined();
    });
  });
});
