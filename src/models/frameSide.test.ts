import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import {
  upsertFrameSide,
  getFrameSide,
  collectFrameSideIDsFromFrames,
  getFrameSidesMap,
  enrichFramesWithSides,
  FrameSide,
} from './frameSide';
import { db, upsertEntityWithNumericID as actualUpsert } from './db'; // Import original db and upsert for mocking
import { Frame, FrameType, frameTypes } from './frames'; // Import Frame type and FrameType

// --- Mock Dependencies ---

// Mock the entire db module, defining mocks inside the factory
vi.mock('./db', async (importOriginal) => {
    const innerMockUpsertEntityWithNumericID = vi.fn();
    const innerMockGet = vi.fn();
    const innerMockWhere = vi.fn();
    const innerMockAnyOf = vi.fn();
    const innerMockToArray = vi.fn();
    const innerMockCollection = { anyOf: innerMockAnyOf.mockReturnThis(), toArray: innerMockToArray };
    innerMockWhere.mockReturnValue(innerMockCollection);

    const original = await importOriginal() as any;
    return {
        ...original,
        upsertEntityWithNumericID: innerMockUpsertEntityWithNumericID, // Mock this specific export
        db: {
            frameside: { // Mock the 'frameside' table
                get: innerMockGet,
                where: innerMockWhere,
                // anyOf and toArray are chained
            },
             // Expose inner mocks for test access
            __mocks: {
                mockUpsertEntityWithNumericID: innerMockUpsertEntityWithNumericID,
                mockGet: innerMockGet, mockWhere: innerMockWhere, mockAnyOf: innerMockAnyOf,
                mockToArray: innerMockToArray, mockCollection: innerMockCollection
            }
        }
    };
});

// Get typed access to the inner mocks
const dbMocks = (db as any).__mocks as {
    mockUpsertEntityWithNumericID: Mock,
    mockGet: Mock, mockWhere: Mock, mockAnyOf: Mock, mockToArray: Mock,
    mockCollection: { anyOf: Mock, toArray: Mock }
};

// --- Test Data ---
const frameSide1: FrameSide = { id: 101, frameId: 1 };
const frameSide2: FrameSide = { id: 102, frameId: 1 };
const frameSide3: FrameSide = { id: 103, frameId: 2 };
const frameSide4: FrameSide = { id: 104, frameId: 2 };

// Use valid FrameType values and cast
const frame1: Frame = { id: 1, boxId: 10, position: 1, type: frameTypes.FOUNDATION as FrameType, leftId: 101, rightId: 102 };
const frame2: Frame = { id: 2, boxId: 10, position: 2, type: frameTypes.EMPTY_COMB as FrameType, leftId: 103, rightId: 104 };
const frameWithoutSides: Frame = { id: 3, boxId: 11, position: 1, type: frameTypes.FEEDER as FrameType, leftId: null, rightId: null };


describe('FrameSide Model', () => {

    beforeEach(() => {
        // ARRANGE: Reset inner mocks using dbMocks reference
        dbMocks.mockUpsertEntityWithNumericID.mockReset();
        dbMocks.mockGet.mockReset();
        dbMocks.mockWhere.mockReset();
        dbMocks.mockAnyOf.mockReset();
        dbMocks.mockToArray.mockReset();

        // ARRANGE: Reset chained mocks
        dbMocks.mockWhere.mockReturnValue(dbMocks.mockCollection);
        dbMocks.mockAnyOf.mockReturnThis();
        dbMocks.mockToArray.mockResolvedValue([]);


        vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
    });

     afterEach(() => {
      vi.restoreAllMocks(); // Restore console.error
    });

    describe('upsertFrameSide', () => {
        it('should call upsertEntityWithNumericID with table name and entity', async () => {
            // ARRANGE
            dbMocks.mockUpsertEntityWithNumericID.mockResolvedValue(undefined);

            // ACT
            await upsertFrameSide(frameSide1);

            // ASSERT
            expect(dbMocks.mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
            expect(dbMocks.mockUpsertEntityWithNumericID).toHaveBeenCalledWith('frameside', frameSide1);
        });

        it('should propagate errors', async () => {
            // ARRANGE
            const error = new Error('Upsert Error');
            dbMocks.mockUpsertEntityWithNumericID.mockRejectedValue(error);

            // ACT & ASSERT
            await expect(upsertFrameSide(frameSide1)).rejects.toThrow(error);
            expect(dbMocks.mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
        });
    });

    describe('getFrameSide', () => {
        it('should return frameside if found', async () => {
            // ARRANGE
            dbMocks.mockGet.mockResolvedValue(frameSide1);

            // ACT
            const result = await getFrameSide(101);

            // ASSERT
            expect(result).toEqual(frameSide1);
            expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
            expect(dbMocks.mockGet).toHaveBeenCalledWith(101); // ID converted to number
        });

         it('should convert string id to number', async () => {
            // ARRANGE
            dbMocks.mockGet.mockResolvedValue(frameSide1);

            // ACT
            await getFrameSide('101' as any);

            // ASSERT
            expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
            expect(dbMocks.mockGet).toHaveBeenCalledWith(101);
        });

        it('should return undefined if not found', async () => {
            // ARRANGE
            dbMocks.mockGet.mockResolvedValue(undefined);

            // ACT
            const result = await getFrameSide(999);

            // ASSERT
            expect(result).toBeUndefined();
            expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
            expect(dbMocks.mockGet).toHaveBeenCalledWith(999);
        });

        it('should throw and log error if db fails', async () => {
            // ARRANGE
            const error = new Error('DB Error');
            dbMocks.mockGet.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');

            // ACT & ASSERT
            await expect(getFrameSide(101)).rejects.toThrow(error);
            expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('collectFrameSideIDsFromFrames', () => {
        it('should return an array of leftId and rightId from frames', () => {
            // ARRANGE
            const frames = [frame1, frame2];
            const expectedIds = [101, 102, 103, 104];

            // ACT
            const result = collectFrameSideIDsFromFrames(frames);

            // ASSERT
            expect(result).toEqual(expect.arrayContaining(expectedIds));
            expect(result.length).toBe(expectedIds.length);
        });

        it('should handle frames with missing side IDs', () => {
            // ARRANGE
            const frames = [frame1, frameWithoutSides, frame2];
            const expectedIds = [101, 102, 103, 104]; // frameWithoutSides contributes no IDs

            // ACT
            const result = collectFrameSideIDsFromFrames(frames);

            // ASSERT
             expect(result).toEqual(expect.arrayContaining(expectedIds));
            expect(result.length).toBe(expectedIds.length);
        });

        it('should return empty array if input is empty', () => {
             // ARRANGE
             const frames: Frame[] = [];

             // ACT
            const result = collectFrameSideIDsFromFrames(frames);

            // ASSERT
            expect(result).toEqual([]);
        });
    });

    describe('getFrameSidesMap', () => {
        it('should fetch frame sides by IDs and return a Map', async () => {
            // ARRANGE
            const ids = [101, 103];
            const dbResult = [frameSide1, frameSide3];
            dbMocks.mockToArray.mockResolvedValue(dbResult);

            // ACT
            const result = await getFrameSidesMap(ids);

            // ASSERT
            expect(dbMocks.mockWhere).toHaveBeenCalledWith('id');
            expect(dbMocks.mockAnyOf).toHaveBeenCalledWith(ids);
            expect(dbMocks.mockToArray).toHaveBeenCalledTimes(1);
            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(2);
            expect(result.get(101)).toEqual(frameSide1);
            expect(result.get(103)).toEqual(frameSide3);
        });

        it('should return an empty Map if no IDs match', async () => {
            // ARRANGE
            const ids = [998, 999];
            dbMocks.mockToArray.mockResolvedValue([]); // No results from DB

            // ACT
            const result = await getFrameSidesMap(ids);

            // ASSERT
            expect(dbMocks.mockWhere).toHaveBeenCalledWith('id');
            expect(dbMocks.mockAnyOf).toHaveBeenCalledWith(ids);
            expect(dbMocks.mockToArray).toHaveBeenCalledTimes(1);
            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(0);
        });

         it('should return an empty Map if input IDs array is empty', async () => {
             // ARRANGE
             const ids: number[] = [];
             dbMocks.mockToArray.mockResolvedValue([]);

            // ACT
            const result = await getFrameSidesMap(ids);

            // ASSERT
            // Dexie might optimize this, but assuming it still calls where/anyOf
            expect(dbMocks.mockWhere).toHaveBeenCalledWith('id');
            expect(dbMocks.mockAnyOf).toHaveBeenCalledWith([]);
            expect(dbMocks.mockToArray).toHaveBeenCalledTimes(1);
            expect(result).toBeInstanceOf(Map);
            expect(result.size).toBe(0);
        });

        // Error handling test for db operation failure would be complex due to chaining
    });

    describe('enrichFramesWithSides', () => {
        // ARRANGE: Mock getFrameSidesMap dynamically
        const mockGetFrameSidesMap = vi.fn();
         beforeEach(async () => {
             vi.doMock('./frameSide', async (importOriginal) => {
                const original = await importOriginal() as any;
                return {
                    ...original, // Keep collectFrameSideIDsFromFrames
                    getFrameSidesMap: mockGetFrameSidesMap,
                 };
            });
        });
         afterEach(() => {
            vi.doUnmock('./frameSide');
        });

         it('should return original frames if input is empty', async () => {
             // ARRANGE
            const inputFrames: Frame[] = [];

            // ACT
            const { enrichFramesWithSides: enrichWithMock } = await import('./frameSide');
            const result = await enrichWithMock(inputFrames);

            // ASSERT
            expect(result).toEqual([]);
            expect(mockGetFrameSidesMap).not.toHaveBeenCalled();
        });
    });

});
