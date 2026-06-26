const favoritesService = require('../src/services/favoritesService');

// Mock Mongoose model
jest.mock('../src/models/Favorite', () => {
  const mockFav = {
    _id: 'mock-id-123',
    type: 'apod',
    nasaId: '2024-03-15',
    title: 'Pillars of Creation',
    notes: '',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const MockFavorite = jest.fn().mockImplementation(() => mockFav);
  MockFavorite.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([mockFav]),
  });
  MockFavorite.findOne = jest.fn().mockResolvedValue(null);
  MockFavorite.findById = jest.fn().mockResolvedValue(mockFav);
  MockFavorite.findByIdAndUpdate = jest.fn().mockResolvedValue({ ...mockFav, notes: 'Updated' });
  MockFavorite.findByIdAndDelete = jest.fn().mockResolvedValue(mockFav);
  MockFavorite.create = jest.fn().mockResolvedValue(mockFav);
  MockFavorite.countDocuments = jest.fn().mockResolvedValue(1);
  return MockFavorite;
});

const Favorite = require('../src/models/Favorite');

describe('Favorites Service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createFavorite', () => {
    it('creates a new favorite successfully', async () => {
      const result = await favoritesService.createFavorite({
        type: 'apod',
        nasaId: '2024-03-15',
        title: 'Pillars of Creation',
      });
      expect(Favorite.create).toHaveBeenCalledTimes(1);
      expect(result.type).toBe('apod');
    });

    it('throws 409 when duplicate favorite exists', async () => {
      Favorite.findOne.mockResolvedValueOnce({ _id: 'exists' });
      await expect(
        favoritesService.createFavorite({ type: 'apod', nasaId: '2024-03-15', title: 'Test' })
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe('getFavoriteById', () => {
    it('returns a favorite by id', async () => {
      const result = await favoritesService.getFavoriteById('mock-id-123');
      expect(result.title).toBe('Pillars of Creation');
    });

    it('throws 404 when not found', async () => {
      Favorite.findById.mockResolvedValueOnce(null);
      await expect(favoritesService.getFavoriteById('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('updateFavorite', () => {
    it('updates notes on a favorite', async () => {
      const result = await favoritesService.updateFavorite('mock-id-123', { notes: 'Updated' });
      expect(result.notes).toBe('Updated');
    });

    it('throws 404 when not found', async () => {
      Favorite.findByIdAndUpdate.mockResolvedValueOnce(null);
      await expect(
        favoritesService.updateFavorite('bad-id', { notes: 'x' })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('deleteFavorite', () => {
    it('deletes a favorite successfully', async () => {
      await expect(favoritesService.deleteFavorite('mock-id-123')).resolves.toBeDefined();
      expect(Favorite.findByIdAndDelete).toHaveBeenCalledWith('mock-id-123');
    });

    it('throws 404 when not found', async () => {
      Favorite.findByIdAndDelete.mockResolvedValueOnce(null);
      await expect(favoritesService.deleteFavorite('bad-id')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
