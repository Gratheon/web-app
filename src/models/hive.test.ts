import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import { getHive, updateHive, Hive } from './hive'; // Import functions and type
import { db } from './db'; // Import original db for type info if needed, but we mock it

// --- Mock Dependencies ---

// Mock the entire db module, defining mocks inside the factory
vi.mock('./db', () => {
  const innerMockGet = vi.fn();
  const innerMockPut = vi.fn();
  return {
    db: {
      hive: { // Mock the 'hive' table specifically
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

describe('Hive Model', () => {

  beforeEach(() => {
    // ARRANGE: Reset inner mocks using dbMocks reference
    dbMocks.mockGet.mockReset();
    dbMocks.mockPut.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
  });

   afterEach(() => {
      vi.restoreAllMocks(); // Restore console.error
  });

  const hive1: Hive = { id: 1, name: 'Hive 1', status: 'ACTIVE', beeCount: 10000 };
  const hive2: Hive = { id: 2, name: 'Hive 2', notes: 'Test notes' };

  describe('getHive', () => {
    it('should return the hive if found by id', async () => {
      // ARRANGE
      dbMocks.mockGet.mockResolvedValue(hive1);
      // ACT
      const result = await getHive(1);
      // ASSERT
      expect(result).toEqual(hive1);
      expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockGet).toHaveBeenCalledWith(1);
    });

    it('should return undefined and log warning if id is invalid (0, null, undefined)', async () => {
      // ARRANGE
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {}); // Spy on console.warn

      // ACT & ASSERT for 0
      const result1 = await getHive(0);
      expect(result1).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Attempted to get hive with invalid ID: 0');

      // ACT & ASSERT for null
      const result2 = await getHive(null as any);
      expect(result2).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Attempted to get hive with invalid ID: null');

      // ACT & ASSERT for undefined
      const result3 = await getHive(undefined as any);
      expect(result3).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith('Attempted to get hive with invalid ID: undefined');

      // ASSERT
      expect(dbMocks.mockGet).not.toHaveBeenCalled();
    });

    it('should return undefined if hive not found (Dexie behavior)', async () => {
      // ARRANGE
      dbMocks.mockGet.mockResolvedValue(undefined);
      // ACT
      const result = await getHive(99);
      // ASSERT
      expect(result).toBeUndefined();
      expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockGet).toHaveBeenCalledWith(99);
    });

    it('should throw and log error if db.get fails', async () => {
      // ARRANGE
      const hiveId = 11;
      const error = new Error('DB Get Error Hive');
      dbMocks.mockGet.mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // ACT & ASSERT
      await expect(getHive(hiveId)).rejects.toThrow(error);
      expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockGet).toHaveBeenCalledWith(hiveId);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('updateHive', () => {
    it('should call db.put with the provided hive data', async () => {
      // ARRANGE
      const hiveData: Hive = { id: 3, name: 'Updated Hive', status: 'INACTIVE' };
      dbMocks.mockPut.mockResolvedValue(3);

      // ACT
      await updateHive(hiveData);

      // ASSERT
      expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockPut).toHaveBeenCalledWith(hiveData);
    });

    it('should call db.put correctly with optional fields', async () => {
      // ARRANGE
      const hiveData: Hive = { id: 4, name: 'Partial Hive', notes: 'new notes', familyId: 10 };
      dbMocks.mockPut.mockResolvedValue(4);

      // ACT
      await updateHive(hiveData);

      // ASSERT
      expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockPut).toHaveBeenCalledWith(hiveData);
    });

    it('should throw and log error if db.put fails', async () => {
      // ARRANGE
      const hiveData: Hive = { id: 5, name: 'Fail Hive' };
      const error = new Error('DB Put Error Hive');
      dbMocks.mockPut.mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // ACT & ASSERT
      await expect(updateHive(hiveData)).rejects.toThrow(error);
      expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockPut).toHaveBeenCalledWith(hiveData);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });
});
