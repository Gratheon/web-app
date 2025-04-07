import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import { getLocale, updateLocale, Locale } from './locales'; // Import functions and type
import { db } from './db'; // Import original db for type info if needed, but we mock it

// --- Mock Dependencies ---

// Mock the entire db module, defining mocks inside the factory
vi.mock('./db', () => {
  const innerMockPut = vi.fn();
  const innerMockWhere = vi.fn();
  const innerMockFirst = vi.fn();
  const innerMockCollection = { first: innerMockFirst };
  innerMockWhere.mockReturnValue(innerMockCollection);

  return {
    db: {
      locale: { // Mock the 'locale' table specifically
        put: innerMockPut,
        where: innerMockWhere,
        // first is chained
      },
      // Expose inner mocks for test access
      __mocks: {
          mockPut: innerMockPut, mockWhere: innerMockWhere, mockFirst: innerMockFirst,
          mockCollection: innerMockCollection
      }
    },
  };
});

// Import the mocked db *after* vi.mock call
// Get typed access to the inner mocks
const dbMocks = (db as any).__mocks as {
    mockPut: Mock, mockWhere: Mock, mockFirst: Mock,
    mockCollection: { first: Mock }
};

describe('Locales Model', () => {

  beforeEach(() => {
    // ARRANGE: Reset inner mocks using dbMocks reference
    dbMocks.mockPut.mockReset();
    dbMocks.mockWhere.mockReset();
    dbMocks.mockFirst.mockReset();

    // ARRANGE: Reset chained mocks
    dbMocks.mockWhere.mockReturnValue(dbMocks.mockCollection);
    dbMocks.mockFirst.mockResolvedValue(undefined); // Default to not found

    vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
  });

   afterEach(() => {
      vi.restoreAllMocks(); // Restore console.error
  });

  const locale1: Locale = { id: 1, en: 'Hello', ru: 'Привет' };
  const locale2: Locale = { id: 2, en: 'World', et: 'Maailm' };

  describe('getLocale', () => {
    it('should return the locale if found by where clause', async () => {
      // ARRANGE
      const whereClause = { en: 'Hello' };
      dbMocks.mockFirst.mockResolvedValue(locale1);
      // ACT
      const result = await getLocale(whereClause);
      // ASSERT
      expect(result).toEqual(locale1);
      expect(dbMocks.mockWhere).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockWhere).toHaveBeenCalledWith(whereClause);
      expect(dbMocks.mockFirst).toHaveBeenCalledTimes(1);
    });

     it('should handle empty where clause', async () => {
      // ARRANGE
      dbMocks.mockFirst.mockResolvedValue(locale1); // Assume it returns the first one
      // ACT
      const result = await getLocale({});
      // ASSERT
      expect(result).toEqual(locale1);
      expect(dbMocks.mockWhere).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockWhere).toHaveBeenCalledWith({});
      expect(dbMocks.mockFirst).toHaveBeenCalledTimes(1);
    });

    it('should return null if locale not found', async () => {
      // ARRANGE
      const whereClause = { en: 'Missing' };
      dbMocks.mockFirst.mockResolvedValue(undefined); // Simulate not found
      // ACT
      const result = await getLocale(whereClause);
      // ASSERT
      expect(result).toBeNull();
      expect(dbMocks.mockWhere).toHaveBeenCalledWith(whereClause);
      expect(dbMocks.mockFirst).toHaveBeenCalledTimes(1);
    });

    it('should throw and log error if db operation fails', async () => {
      // ARRANGE
      const whereClause = { en: 'Fail' };
      const error = new Error('DB Where/First Error');
      dbMocks.mockFirst.mockRejectedValue(error); // Make first() fail
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // ACT & ASSERT
      await expect(getLocale(whereClause)).rejects.toThrow(error);
      expect(dbMocks.mockWhere).toHaveBeenCalledWith(whereClause);
      expect(dbMocks.mockFirst).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('updateLocale', () => {
    it('should convert string ID to number and call db.put', async () => {
      // ARRANGE
      const localeData: Locale = { id: '3' as any, en: 'Test', et: 'Testi' };
      const expectedData = { ...localeData, id: 3 }; // ID converted
      dbMocks.mockPut.mockResolvedValue(3);

      // ACT
      await updateLocale(localeData);

      // ASSERT
      expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockPut).toHaveBeenCalledWith(expectedData);
    });

     it('should call db.put with numeric ID if already number', async () => {
      // ARRANGE
      const localeData: Locale = { id: 4, en: 'Four', de: 'Vier' };
      dbMocks.mockPut.mockResolvedValue(4);

      // ACT
      await updateLocale(localeData);

      // ASSERT
      expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockPut).toHaveBeenCalledWith(localeData); // ID remains number
    });

    it('should throw and log error if db.put fails', async () => {
      // ARRANGE
      const localeData: Locale = { id: 5, en: 'Fail' };
      const error = new Error('DB Put Error Locale');
      dbMocks.mockPut.mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // ACT & ASSERT
      await expect(updateLocale(localeData)).rejects.toThrow(error);
      expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockPut).toHaveBeenCalledWith(localeData); // ID is already number
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });
});
