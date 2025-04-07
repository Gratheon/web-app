import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import { getFile, updateFile, File } from './files'; // Import functions and type
import { db } from './db'; // Import original db for type info if needed, but we mock it
import { FileResize } from './fileResize'; // Import dependent type

// --- Mock Dependencies ---

// Mock the entire db module, defining mocks inside the factory
vi.mock('./db', () => {
  const innerMockGet = vi.fn();
  const innerMockPut = vi.fn();
  return {
    db: {
      file: { // Mock the 'file' table specifically
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

describe('File Model', () => {

  beforeEach(() => {
    // ARRANGE: Reset inner mocks using dbMocks reference
    dbMocks.mockGet.mockReset();
    dbMocks.mockPut.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
  });

   afterEach(() => {
      vi.restoreAllMocks(); // Restore console.error
  });

  const resize1: FileResize = { id: 1, file_id: 10, url: 'url1_100', max_dimension_px: 100 };
  const file1: File = { id: 10, url: 'url1', resizes: [resize1] };

  describe('getFile', () => {
    it('should return the file if found by numeric id', async () => {
      // ARRANGE
      dbMocks.mockGet.mockResolvedValue(file1);
      // ACT
      const result = await getFile(10);
      // ASSERT
      expect(result).toEqual(file1);
      expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockGet).toHaveBeenCalledWith(10); // ID is converted to number
    });

     it('should convert string id to number before calling db.get', async () => {
      // ARRANGE
      dbMocks.mockGet.mockResolvedValue(file1);
      // ACT
      const result = await getFile('10' as any); // Pass string ID
      // ASSERT
      expect(result).toEqual(file1);
      expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockGet).toHaveBeenCalledWith(10); // Should be called with number
    });

    it('should return undefined if file not found (Dexie behavior)', async () => {
      // ARRANGE
      dbMocks.mockGet.mockResolvedValue(undefined);
      // ACT
      const result = await getFile(99);
      // ASSERT
      expect(result).toBeUndefined();
      expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockGet).toHaveBeenCalledWith(99);
    });

    it('should throw and log error if db.get fails', async () => {
      // ARRANGE
      const fileId = 11;
      const error = new Error('DB Get Error File');
      dbMocks.mockGet.mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // ACT & ASSERT
      await expect(getFile(fileId)).rejects.toThrow(error);
      expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockGet).toHaveBeenCalledWith(fileId);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('updateFile', () => {
    it('should call db.put with the provided file data', async () => {
      // ARRANGE
      const fileData: any = { id: 11, url: 'url2', resizes: [] }; // Cast to any for test data
      dbMocks.mockPut.mockResolvedValue(11);

      // ACT
      await updateFile(fileData);

      // ASSERT
      expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockPut).toHaveBeenCalledWith(fileData);
    });

    it('should throw and log error if db.put fails', async () => {
      // ARRANGE
      const fileData: any = { id: 12, url: 'url3', resizes: [] }; // Cast to any for test data
      const error = new Error('DB Put Error File');
      dbMocks.mockPut.mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // ACT & ASSERT
      await expect(updateFile(fileData)).rejects.toThrow(error);
      expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockPut).toHaveBeenCalledWith(fileData);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });
});
