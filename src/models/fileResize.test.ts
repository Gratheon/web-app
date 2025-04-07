import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import { upsertFileResize, getFileResizes, FileResize } from './fileResize';
import { db, upsertEntityWithNumericID as actualUpsert } from './db'; // Import original db and upsert for mocking

// Mock the entire db module, defining mocks inside the factory
vi.mock('./db', async (importOriginal) => {
    const innerMockUpsertEntityWithNumericID = vi.fn();
    const innerMockWhere = vi.fn();
    const innerMockToArray = vi.fn();
    const innerMockCollection = { toArray: innerMockToArray };
    innerMockWhere.mockReturnValue(innerMockCollection);

    const original = await importOriginal() as any;
    return {
        ...original, // Keep other exports from './db' if needed
        upsertEntityWithNumericID: innerMockUpsertEntityWithNumericID,
        // Also mock the db instance for getFileResizes
        db: {
            fileresize: { // Mock the 'fileresize' table
                where: innerMockWhere,
                // toArray is chained
            },
             // Expose inner mocks for test access
            __mocks: {
                mockUpsertEntityWithNumericID: innerMockUpsertEntityWithNumericID,
                mockWhere: innerMockWhere,
                mockToArray: innerMockToArray,
                mockCollection: innerMockCollection
            }
        }
    };
});

// Import the mocked db *after* vi.mock call
// Get typed access to the inner mocks
const dbMocks = (db as any).__mocks as {
    mockUpsertEntityWithNumericID: Mock, mockWhere: Mock, mockToArray: Mock,
    mockCollection: { toArray: Mock }
};

describe('FileResize Model', () => {

    beforeEach(() => {
        // Reset inner mocks using dbMocks reference
        dbMocks.mockUpsertEntityWithNumericID.mockReset();
        dbMocks.mockWhere.mockReset();
        dbMocks.mockToArray.mockReset();

        // Reset chained mocks
        dbMocks.mockWhere.mockReturnValue(dbMocks.mockCollection);
        dbMocks.mockToArray.mockResolvedValue([]); // Default

        vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
    });

     afterEach(() => {
      vi.restoreAllMocks(); // Restore console.error
    });

    const resize1: FileResize = { id: 1, file_id: 10, url: 'url1', max_dimension_px: 100 };
    const resize2: FileResize = { id: 2, file_id: 10, url: 'url2', max_dimension_px: 500 };
    const resize3: FileResize = { id: 3, file_id: 11, url: 'url3', max_dimension_px: 100 };

    describe('upsertFileResize', () => {
        it('should call upsertEntityWithNumericID with table name and entity', async () => {
            // ARRANGE
            dbMocks.mockUpsertEntityWithNumericID.mockResolvedValue(undefined); // It returns void

            // ACT
            await upsertFileResize(resize1);

            // ASSERT
            expect(dbMocks.mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
            expect(dbMocks.mockUpsertEntityWithNumericID).toHaveBeenCalledWith('fileresize', resize1);
        });

        it('should propagate errors from upsertEntityWithNumericID', async () => {
            // ARRANGE
            const error = new Error('Upsert Failed');
            dbMocks.mockUpsertEntityWithNumericID.mockRejectedValue(error);

            // ACT & ASSERT
            await expect(upsertFileResize(resize1)).rejects.toThrow(error);
            expect(dbMocks.mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
        });
    });

    describe('getFileResizes', () => {
        it('should call db.fileresize.where(where).toArray()', async () => {
            // ARRANGE
            const whereClause = { file_id: 10 };
            const expectedResult = [resize1, resize2];
            dbMocks.mockToArray.mockResolvedValue(expectedResult);

            // ACT
            const result = await getFileResizes(whereClause);

            // ASSERT
            expect(result).toEqual(expectedResult);
            expect(dbMocks.mockWhere).toHaveBeenCalledTimes(1);
            expect(dbMocks.mockWhere).toHaveBeenCalledWith(whereClause);
            expect(dbMocks.mockToArray).toHaveBeenCalledTimes(1);
        });

         it('should handle empty where clause', async () => {
            // ARRANGE
            const expectedResult = [resize1, resize2, resize3];
            dbMocks.mockToArray.mockResolvedValue(expectedResult);

            // ACT
            const result = await getFileResizes({});

            // ASSERT
            expect(result).toEqual(expectedResult);
            expect(dbMocks.mockWhere).toHaveBeenCalledTimes(1);
            expect(dbMocks.mockWhere).toHaveBeenCalledWith({});
            expect(dbMocks.mockToArray).toHaveBeenCalledTimes(1);
        });

        it('should return null and log error if db operation fails', async () => {
            // ARRANGE
            const whereClause = { file_id: 11 };
            const error = new Error('DB Where/ToArray Error');
            dbMocks.mockToArray.mockRejectedValue(error); // Make toArray fail
            const consoleErrorSpy = vi.spyOn(console, 'error');

            // ACT
            const result = await getFileResizes(whereClause);

            // ASSERT
            expect(result).toBeNull();
            expect(dbMocks.mockWhere).toHaveBeenCalledWith(whereClause);
            expect(dbMocks.mockToArray).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });
    });
});
