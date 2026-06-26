const neoService = require('../src/services/neoService');

// Mock NASA client and Redis to isolate service logic
jest.mock('../src/config/nasaClient', () => ({
  get: jest.fn(),
}));
jest.mock('../src/config/redis', () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
}));

const nasaClient = require('../src/config/nasaClient');

const mockNasaResponse = {
  data: {
    element_count: 2,
    links: {},
    near_earth_objects: {
      '2024-03-01': [
        {
          id: '12345',
          name: '(2024 AB)',
          nasa_jpl_url: 'https://ssd.jpl.nasa.gov/',
          is_potentially_hazardous_asteroid: false,
          estimated_diameter: {
            kilometers: { estimated_diameter_min: 0.1, estimated_diameter_max: 0.3 },
          },
          close_approach_data: [{ close_approach_date: '2024-03-01', relative_velocity: {}, miss_distance: {} }],
          absolute_magnitude_h: 22.1,
        },
      ],
      '2024-03-02': [
        {
          id: '67890',
          name: '(2024 CD)',
          nasa_jpl_url: 'https://ssd.jpl.nasa.gov/',
          is_potentially_hazardous_asteroid: true,
          estimated_diameter: {
            kilometers: { estimated_diameter_min: 1.0, estimated_diameter_max: 2.5 },
          },
          close_approach_data: [],
          absolute_magnitude_h: 18.5,
        },
      ],
    },
  },
};

describe('NEO Service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('Date range validation', () => {
    it('rejects date ranges exceeding 7 days', async () => {
      await expect(
        neoService.getNeoFeed({ start_date: '2024-03-01', end_date: '2024-03-10' })
      ).rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining('7 days') });
    });

    it('rejects end_date before start_date', async () => {
      await expect(
        neoService.getNeoFeed({ start_date: '2024-03-05', end_date: '2024-03-01' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects invalid date format', async () => {
      await expect(
        neoService.getNeoFeed({ start_date: 'not-a-date', end_date: '2024-03-07' })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('accepts valid 7-day range', async () => {
      nasaClient.get.mockResolvedValue(mockNasaResponse);
      const result = await neoService.getNeoFeed({
        start_date: '2024-03-01',
        end_date: '2024-03-07',
      });
      expect(result.near_earth_objects).toHaveLength(2);
    });

    it('accepts same-day range (0 days)', async () => {
      nasaClient.get.mockResolvedValue(mockNasaResponse);
      await expect(
        neoService.getNeoFeed({ start_date: '2024-03-01', end_date: '2024-03-01' })
      ).resolves.toBeDefined();
    });
  });

  describe('Diameter filtering', () => {
    beforeEach(() => nasaClient.get.mockResolvedValue(mockNasaResponse));

    it('filters by min_diameter', async () => {
      const result = await neoService.getNeoFeed({
        start_date: '2024-03-01',
        end_date: '2024-03-02',
        min_diameter: 0.5,
      });
      // Only the larger asteroid should pass
      expect(result.near_earth_objects.every((o) => o.estimated_diameter_km.min >= 0.5)).toBe(true);
    });

    it('filters by max_diameter', async () => {
      const result = await neoService.getNeoFeed({
        start_date: '2024-03-01',
        end_date: '2024-03-02',
        max_diameter: 1.0,
      });
      expect(result.near_earth_objects.every((o) => o.estimated_diameter_km.max <= 1.0)).toBe(true);
    });
  });

  describe('Asteroid ID validation', () => {
    it('rejects non-numeric asteroid ID', async () => {
      await expect(neoService.getNeoById('abc')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('rejects empty asteroid ID', async () => {
      await expect(neoService.getNeoById('')).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
