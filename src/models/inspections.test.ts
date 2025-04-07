import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import { getInspection, listInspections, updateInspection, Inspection } from './inspections'; // Import functions and type
import { db } from './db'; // Import original db for type info if needed, but we mock it

// --- Mock Dependencies ---

// Mock the entire db module, defining mocks inside the factory
vi.mock('./db', () => {
  const innerMockGet = vi.fn();
  const innerMockPut = vi.fn();
  const innerMockWhere = vi.fn();
  const innerMockReverse = vi.fn();
  const innerMockLimit = vi.fn();
  const innerMockToArray = vi.fn();
  const innerMockCollection = {
    reverse: innerMockReverse.mockReturnThis(),
    limit: innerMockLimit.mockReturnThis(),
    toArray: innerMockToArray,
  };
  innerMockWhere.mockReturnValue(innerMockCollection);

  return {
    db: {
      inspection: { // Mock the 'inspection' table specifically
        get: innerMockGet,
        put: innerMockPut,
        where: innerMockWhere,
        // reverse, limit, toArray are chained
      },
      // Expose inner mocks for test access
      __mocks: {
          mockGet: innerMockGet, mockPut: innerMockPut, mockWhere: innerMockWhere,
          mockReverse: innerMockReverse, mockLimit: innerMockLimit, mockToArray: innerMockToArray,
          mockCollection: innerMockCollection
      }
    },
  };
});

// Import the mocked db *after* vi.mock call
// Get typed access to the inner mocks
const dbMocks = (db as any).__mocks as {
    mockGet: Mock, mockPut: Mock, mockWhere: Mock, mockReverse: Mock,
    mockLimit: Mock, mockToArray: Mock,
    mockCollection: { reverse: Mock, limit: Mock, toArray: Mock }
};


describe('Inspections Model', () => {

  beforeEach(() => {
    // ARRANGE: Reset inner mocks using dbMocks reference
    dbMocks.mockGet.mockReset();
    dbMocks.mockPut.mockReset();
    dbMocks.mockWhere.mockReset();
    dbMocks.mockReverse.mockReset();
    dbMocks.mockLimit.mockReset();
    dbMocks.mockToArray.mockReset();

    // ARRANGE: Reset chained mocks
    dbMocks.mockWhere.mockReturnValue(dbMocks.mockCollection);
    dbMocks.mockReverse.mockReturnThis();
    dbMocks.mockLimit.mockReturnThis();
    dbMocks.mockToArray.mockResolvedValue([]); // Default to empty array

    vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
  });

   afterEach(() => {
      vi.restoreAllMocks(); // Restore console.error
  });

  const inspection1: Inspection = { id: 1, hiveId: 10, data: '{"temp": 25}', added: '2024-01-01' };
  const inspection2: Inspection = { id: 2, hiveId: 10, data: '{"humidity": 60}', added: '2024-01-02' };
  const inspection3: Inspection = { id: 3, hiveId: 11, data: '{"queen": true}', added: '2024-01-03' };

  describe('getInspection', () => {
    it('should return the inspection if found by id', async () => {
      // ARRANGE
      dbMocks.mockGet.mockResolvedValue(inspection1);
      // ACT
      const result = await getInspection(1);
      // ASSERT
      expect(result).toEqual(inspection1);
      expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockGet).toHaveBeenCalledWith(1);
    });

    it('should return null and log error if id is invalid', async () => {
      // ARRANGE
      const consoleErrorSpy = vi.spyOn(console, 'error');
      // ACT
      const result = await getInspection(0);
      // ASSERT
      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('attempt to get hive with invalid id', { id: 0 }); // Note: Error message copied from source
      expect(dbMocks.mockGet).not.toHaveBeenCalled();
    });

    it('should return undefined if inspection not found (Dexie behavior)', async () => {
      // ARRANGE
      dbMocks.mockGet.mockResolvedValue(undefined);
      // ACT
      const result = await getInspection(99);
      // ASSERT
      expect(result).toBeUndefined();
      expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockGet).toHaveBeenCalledWith(99);
    });

    it('should throw and log error if db.get fails', async () => {
      // ARRANGE
      const inspectionId = 11;
      const error = new Error('DB Get Error Inspection');
      dbMocks.mockGet.mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // ACT & ASSERT
      await expect(getInspection(inspectionId)).rejects.toThrow(error);
      expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockGet).toHaveBeenCalledWith(inspectionId);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('listInspections', () => {
    it('should call db.where().reverse().limit().toArray()', async () => {
        // ARRANGE
        const hiveId = 10;
        const expectedResult = [inspection2, inspection1]; // Reversed order
        dbMocks.mockToArray.mockResolvedValue(expectedResult);

        // ACT
        const result = await listInspections(hiveId);

        // ASSERT
        expect(result).toEqual(expectedResult);
        expect(dbMocks.mockWhere).toHaveBeenCalledWith({ hiveId });
        expect(dbMocks.mockReverse).toHaveBeenCalledTimes(1);
        expect(dbMocks.mockLimit).toHaveBeenCalledWith(100);
        expect(dbMocks.mockToArray).toHaveBeenCalledTimes(1);
    });

     it('should return null and log error if hiveId is invalid', async () => {
        // ARRANGE
        const consoleErrorSpy = vi.spyOn(console, 'error');
        // ACT
        const result = await listInspections(0);
        // ASSERT
        expect(result).toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalledWith('attempt to get inspections with invalid hiveId', { hiveId: 0 });
        expect(dbMocks.mockWhere).not.toHaveBeenCalled();
    });

     it('should return empty array if no inspections found', async () => {
        // ARRANGE
        const hiveId = 99;
        dbMocks.mockToArray.mockResolvedValue([]); // No results

        // ACT
        const result = await listInspections(hiveId);

        // ASSERT
        expect(result).toEqual([]);
        expect(dbMocks.mockWhere).toHaveBeenCalledWith({ hiveId });
        expect(dbMocks.mockToArray).toHaveBeenCalledTimes(1);
    });

    it('should throw and log error if db operation fails', async () => {
        // ARRANGE
        const hiveId = 10;
        const error = new Error('DB List Error');
        dbMocks.mockToArray.mockRejectedValue(error); // Make toArray fail
        const consoleErrorSpy = vi.spyOn(console, 'error');

        // ACT & ASSERT
        await expect(listInspections(hiveId)).rejects.toThrow(error);
        expect(dbMocks.mockWhere).toHaveBeenCalledWith({ hiveId });
        expect(dbMocks.mockToArray).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('updateInspection', () => {
    it('should call db.put with the provided inspection data', async () => {
      // ARRANGE
      const inspectionData: Inspection = { id: 4, hiveId: 12, data: '{}', added: '2024-02-01' };
      dbMocks.mockPut.mockResolvedValue(4); // put returns the key

      // ACT
      await updateInspection(inspectionData);

      // ASSERT
      expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockPut).toHaveBeenCalledWith(inspectionData);
    });

    it('should throw and log error if db.put fails', async () => {
      // ARRANGE
      const inspectionData: Inspection = { id: 5, hiveId: 13, data: '{"a":1}', added: '2024-02-02' };
      const error = new Error('DB Put Error Inspection');
      dbMocks.mockPut.mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // ACT & ASSERT
      await expect(updateInspection(inspectionData)).rejects.toThrow(error);
      expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockPut).toHaveBeenCalledWith(inspectionData);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });
});
