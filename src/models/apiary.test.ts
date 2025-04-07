import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { getApiary, updateApiary, Apiary } from './apiary'; // Import functions and type
import { db } from './db'; // Import original db for type info if needed, but we mock it

// --- Mock Dependencies ---

// Mock the entire db module
vi.mock('./db', () => {
  const mockGet = vi.fn();
  const mockPut = vi.fn();
  return {
    db: {
      apiary: { // Mock the 'apiary' table specifically
        get: mockGet,
        put: mockPut,
      },
      // Expose mocks for test access
      __mocks: { mockGet, mockPut }
    },
  };
});

// Import the mocked db *after* vi.mock call
// Cast db to 'any' to access the mocked 'apiary' property without TS error
const mockedDbApiary = (db as any).apiary as { get: Mock, put: Mock };

describe('Apiary Model', () => {

  beforeEach(() => {
    // ARRANGE: Reset mocks before each test
    // Reset mocks before each test using the reference from the mocked module
    mockedDbApiary.get.mockReset();
    mockedDbApiary.put.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
  });

  afterEach(() => {
      vi.restoreAllMocks();
  });

  describe('getApiary', () => {
    it('should return the apiary if found in the database', async () => {
      // ARRANGE
      const mockApiary: Apiary = { id: 1, name: 'Test Apiary', lat: '10', lng: '20' };
      mockedDbApiary.get.mockResolvedValue(mockApiary);

      // ACT
      const apiary = await getApiary(1);

      // ASSERT
      expect(apiary).toEqual(mockApiary);
      expect(mockedDbApiary.get).toHaveBeenCalledTimes(1);
      expect(mockedDbApiary.get).toHaveBeenCalledWith(1);
    });

    it('should return undefined if apiary is not found', async () => { // Corrected expectation based on previous fix
      // ARRANGE
      mockedDbApiary.get.mockResolvedValue(undefined);

      // ACT
      const apiary = await getApiary(99);

      // ASSERT
      expect(apiary).toBeUndefined();
      expect(mockedDbApiary.get).toHaveBeenCalledTimes(1);
      expect(mockedDbApiary.get).toHaveBeenCalledWith(99);
    });

    it('should return null and log error if id is invalid (0, null, undefined)', async () => {
      // ARRANGE
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // ACT & ASSERT for 0
      const result1 = await getApiary(0);
      expect(result1).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('attempt to get apiary with invalid id', { id: 0 });

      // ACT & ASSERT for null
      const result2 = await getApiary(null as any);
      expect(result2).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('attempt to get apiary with invalid id', { id: null });

      // ACT & ASSERT for undefined
      const result3 = await getApiary(undefined as any);
      expect(result3).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('attempt to get apiary with invalid id', { id: undefined });

      // ASSERT
      expect(mockedDbApiary.get).not.toHaveBeenCalled();
    });

    it('should throw and log error if the database operation fails', async () => {
      // ARRANGE
      const mockError = new Error('Database read error');
      mockedDbApiary.get.mockRejectedValue(mockError);
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // ACT & ASSERT
      await expect(getApiary(2)).rejects.toThrowError(mockError);
      expect(mockedDbApiary.get).toHaveBeenCalledTimes(1);
      expect(mockedDbApiary.get).toHaveBeenCalledWith(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith("failed to read apiary", mockError);
    });
  });

  describe('updateApiary', () => {
    it('should call db.put with the provided apiary data', async () => {
      // ARRANGE
      const apiaryData: Apiary = { id: 3, name: 'Updated Apiary', lat: '11', lng: '21' };
      mockedDbApiary.put.mockResolvedValue(3);

      // ACT
      await updateApiary(apiaryData);

      // ASSERT
      expect(mockedDbApiary.put).toHaveBeenCalledTimes(1);
      expect(mockedDbApiary.put).toHaveBeenCalledWith({
          id: apiaryData.id,
          name: apiaryData.name,
          lat: apiaryData.lat,
          lng: apiaryData.lng
      });
    });

     it('should call db.put correctly even with missing optional fields', async () => {
      // ARRANGE
      const apiaryData: Apiary = { id: 4, name: 'Partial Apiary' }; // lat/lng missing
      mockedDbApiary.put.mockResolvedValue(4);

      // ACT
      await updateApiary(apiaryData);

      // ASSERT
      expect(mockedDbApiary.put).toHaveBeenCalledTimes(1);
      expect(mockedDbApiary.put).toHaveBeenCalledWith({
          id: apiaryData.id,
          name: apiaryData.name,
          lat: undefined, // Should pass undefined for missing optional fields
          lng: undefined
      });
    });

    it('should throw and log error if db.put fails', async () => {
      // ARRANGE
      const apiaryData: Apiary = { id: 5, name: 'Fail Apiary' };
      const mockError = new Error('Database write error');
      mockedDbApiary.put.mockRejectedValue(mockError);
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // ACT & ASSERT
      await expect(updateApiary(apiaryData)).rejects.toThrowError(mockError);
      expect(mockedDbApiary.put).toHaveBeenCalledTimes(1);
      expect(mockedDbApiary.put).toHaveBeenCalledWith({
          id: apiaryData.id,
          name: apiaryData.name,
          lat: undefined,
          lng: undefined
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith("failed to update apiary", mockError);
    });
  });
});
