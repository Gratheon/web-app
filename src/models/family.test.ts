import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import { getFamilyByHive, updateFamily, Family } from './family'; // Import functions and type
import { db } from './db'; // Import original db for type info if needed, but we mock it

// --- Mock Dependencies ---

// Mock the entire db module, defining mocks inside the factory
vi.mock('./db', () => {
  const innerMockGet = vi.fn();
  const innerMockPut = vi.fn();
  return {
    db: {
      family: { // Mock the 'family' table specifically
        get: innerMockGet,
        put: innerMockPut,
      },
      // Expose inner mocks for test access
      __mocks: { mockGet: innerMockGet, mockPut: innerMockPut }
    },
  };
});

// Import the mocked db *after* vi.mock call
// Get typed access to the inner mocks
const dbMocks = (db as any).__mocks as { mockGet: Mock, mockPut: Mock };

describe('Family Model', () => {

  beforeEach(() => {
    // ARRANGE: Reset inner mocks using dbMocks reference
    dbMocks.mockGet.mockReset();
    dbMocks.mockPut.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
  });

   afterEach(() => {
      vi.restoreAllMocks(); // Restore console.error
  });

  const family1: Family = { id: 1, hiveId: 10, race: 'Carniolan', added: '2023-01-01', age: 1 };

  describe('getFamilyByHive', () => {
    it('should return the family if found by hiveId', async () => {
      // ARRANGE
      dbMocks.mockGet.mockResolvedValue(family1);
      // ACT
      const result = await getFamilyByHive(10);
      // ASSERT
      expect(result).toEqual(family1);
      expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockGet).toHaveBeenCalledWith({ hiveId: 10 });
    });

    it('should return undefined if family not found (Dexie behavior)', async () => {
      // ARRANGE
      dbMocks.mockGet.mockResolvedValue(undefined);
      // ACT
      const result = await getFamilyByHive(99);
      // ASSERT
      expect(result).toBeUndefined();
      expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockGet).toHaveBeenCalledWith({ hiveId: 99 });
    });

    it('should throw and log error if db.get fails', async () => {
      // ARRANGE
      const hiveId = 11;
      const error = new Error('DB Get Error Family');
      dbMocks.mockGet.mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // ACT & ASSERT
      await expect(getFamilyByHive(hiveId)).rejects.toThrow(error);
      expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockGet).toHaveBeenCalledWith({ hiveId });
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('updateFamily', () => {
    it('should call db.put with the provided family data', async () => {
      // ARRANGE
      const familyData: Family = { id: 2, hiveId: 11, race: 'Buckfast', added: '2024-01-01' };
      dbMocks.mockPut.mockResolvedValue(2);

      // ACT
      await updateFamily(familyData);

      // ASSERT
      expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockPut).toHaveBeenCalledWith(familyData);
    });

    it('should call db.put correctly with optional fields', async () => {
      // ARRANGE
      const familyData: Family = { id: 3, hiveId: 12, race: 'Italian', added: '2024-05-01', age: 0 };
      dbMocks.mockPut.mockResolvedValue(3);

      // ACT
      await updateFamily(familyData);

      // ASSERT
      expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockPut).toHaveBeenCalledWith(familyData);
    });

    it('should throw and log error if db.put fails', async () => {
      // ARRANGE
      const familyData: Family = { id: 4, hiveId: 13, race: 'Caucasian', added: '2022-01-01' };
      const error = new Error('DB Put Error Family');
      dbMocks.mockPut.mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // ACT & ASSERT
      await expect(updateFamily(familyData)).rejects.toThrow(error);
      expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockPut).toHaveBeenCalledWith(familyData);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });
});
