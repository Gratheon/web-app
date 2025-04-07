import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import { FRAME_SIDE_CELL_TABLE } from './frameSideCells'; // Import constant needed for mock

// Use vi.hoisted to define mocks before vi.mock runs
const mocks = vi.hoisted(() => {
    const innerMockGet = vi.fn();
    const innerMockPut = vi.fn();
    const innerMockWhere = vi.fn();
    const innerMockAnyOf = vi.fn();
    const innerMockToArray = vi.fn();
    const innerMockDelete = vi.fn();
    const innerMockCollection = {
        anyOf: innerMockAnyOf.mockReturnThis(),
        toArray: innerMockToArray,
        delete: innerMockDelete,
    };
    innerMockWhere.mockReturnValue(innerMockCollection);

    return {
        innerMockGet, innerMockPut, innerMockWhere, innerMockAnyOf,
        innerMockToArray, innerMockDelete, innerMockCollection
    };
});

// Mock the db module using the hoisted mocks
vi.mock('./db', async (importOriginal) => {
    const original = await importOriginal() as any;
    return {
        ...original,
        db: {
            ["files_frame_side_cells"]: { // Use constant for table name
                get: mocks.innerMockGet,
                put: mocks.innerMockPut,
                where: mocks.innerMockWhere,
            },
            // Expose inner mocks for test access
            __mocks: {
                mockGet: mocks.innerMockGet, mockPut: mocks.innerMockPut, mockWhere: mocks.innerMockWhere,
                mockAnyOf: mocks.innerMockAnyOf, mockToArray: mocks.innerMockToArray, mockDelete: mocks.innerMockDelete,
                mockCollection: mocks.innerMockCollection
            }
        }
    };
});

// Now import the db and other modules after the mock is set up
import { db } from './db';

import {
  newFrameSideCells,
  getFrameSideCells,
  updateFrameStat,
  updateFrameSideCells,
  getHiveInspectionStats,
  deleteCellsByFrameSideIDs,
  enrichFramesWithSideCells,
  FrameSideCells,
  // FRAME_SIDE_CELL_TABLE, // Already imported
  HiveInspectionCellStats,
} from './frameSideCells';


import { Frame, FrameType, frameTypes } from './frames'; // Import Frame type and FrameType


// Get typed access to the inner mocks using the hoisted 'mocks' object
const dbMocks = mocks; // Simpler access

// --- Test Data ---
const cells1: FrameSideCells = { id: 101, frameSideId: 101, hiveId: 10, broodPercent: 10, honeyPercent: 20, pollenPercent: 5, eggsPercent: 2, cappedBroodPercent: 3 };
const cells2: FrameSideCells = { id: 102, frameSideId: 102, hiveId: 10, broodPercent: 15, honeyPercent: 25, pollenPercent: 10, eggsPercent: 5, cappedBroodPercent: 5 };
const cells3: FrameSideCells = { id: 103, frameSideId: 103, hiveId: 11, broodPercent: 5, honeyPercent: 50, pollenPercent: 1, eggsPercent: 1, cappedBroodPercent: 1 };
const cells4: FrameSideCells = { id: 104, frameSideId: 104, hiveId: 11, broodPercent: 8, honeyPercent: 40, pollenPercent: 2, eggsPercent: 2, cappedBroodPercent: 2 };

// Explicitly cast FrameType for test data
const frame1: Frame = { id: 1, boxId: 10, position: 1, type: frameTypes.FOUNDATION as FrameType, leftId: 101, rightId: 102, leftSide: { id: 101 }, rightSide: { id: 102 } };
const frame2: Frame = { id: 2, boxId: 11, position: 1, type: frameTypes.EMPTY_COMB as FrameType, leftId: 103, rightId: 104, leftSide: { id: 103 }, rightSide: { id: 104 } };
const frameNoSides: Frame = { id: 3, boxId: 12, position: 1, type: frameTypes.FEEDER as FrameType, leftId: null, rightId: null };


describe('FrameSideCells Model', () => {

    beforeEach(() => {
        // ARRANGE: Reset inner mocks using dbMocks reference
        dbMocks.innerMockGet.mockReset();
        dbMocks.innerMockPut.mockReset();
        dbMocks.innerMockWhere.mockReset();
        dbMocks.innerMockAnyOf.mockReset();
        dbMocks.innerMockToArray.mockReset();
        dbMocks.innerMockDelete.mockReset();

        // ARRANGE: Reset chained mocks
        dbMocks.innerMockWhere.mockReturnValue(dbMocks.innerMockCollection);
        dbMocks.innerMockAnyOf.mockReturnThis();
        dbMocks.innerMockToArray.mockResolvedValue([]);
        dbMocks.innerMockDelete.mockResolvedValue(undefined);

        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

     afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('newFrameSideCells', () => {
        it('should return a new cells object with default values', () => {
            // ARRANGE
            const id = 105;
            const hiveId = 15;
            const expected: FrameSideCells = {
                id: id,
                frameSideId: id,
                hiveId: hiveId,
                broodPercent: 0,
                honeyPercent: 0,
                pollenPercent: 0,
                eggsPercent: 0,
                cappedBroodPercent: 0,
            };
            // ACT & ASSERT
            expect(newFrameSideCells(id, hiveId)).toEqual(expected);
        });
    });

    describe('getFrameSideCells', () => {
        it('should call db.get with numeric id', async () => {
            // ARRANGE
            dbMocks.innerMockGet.mockResolvedValue(cells1);
            const { getFrameSideCells: actualGet } = await import('./frameSideCells'); // Import actual function

            // ACT
            const result = await actualGet(101);

            // ASSERT
            expect(result).toEqual(cells1);
            expect(dbMocks.innerMockGet).toHaveBeenCalledTimes(1);
            expect(dbMocks.innerMockGet).toHaveBeenCalledWith(101);
        });

         it('should convert string id to number', async () => {
            // ARRANGE
            dbMocks.innerMockGet.mockResolvedValue(cells1);
             const { getFrameSideCells: actualGet } = await import('./frameSideCells');

             // ACT
            await actualGet('101' as any);

            // ASSERT
            expect(dbMocks.innerMockGet).toHaveBeenCalledTimes(1);
            expect(dbMocks.innerMockGet).toHaveBeenCalledWith(101);
        });

        it('should return null and log error if db fails', async () => {
            // ARRANGE
            const error = new Error('DB Error');
            dbMocks.innerMockGet.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');
             const { getFrameSideCells: actualGet } = await import('./frameSideCells');

             // ACT
            const result = await actualGet(101);

            // ASSERT
            expect(result).toBeNull();
            expect(dbMocks.innerMockGet).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('updateFrameStat', () => {
        it('should update the specified key and call db.put', async () => {
            // ARRANGE
            const initialCells = { ...cells1, broodPercent: 10 };
            const key = 'broodPercent';
            const percent = 25;
            const expectedCells = { ...initialCells, [key]: percent };
            dbMocks.innerMockPut.mockResolvedValue(101);

            // ACT
            const result = await updateFrameStat(initialCells, key, percent);

            // ASSERT
            expect(result[key]).toBe(percent);
            expect(dbMocks.innerMockPut).toHaveBeenCalledTimes(1);
            expect(dbMocks.innerMockPut).toHaveBeenCalledWith(expectedCells);
        });

        it('should normalize percentages if total exceeds 100', async () => {
            // ARRANGE
            const initialCells: FrameSideCells = { id: 101, frameSideId: 101, hiveId: 10, broodPercent: 50, honeyPercent: 40, pollenPercent: 10, eggsPercent: 0, cappedBroodPercent: 0 };
            const key = 'broodPercent';
            const percent = 60; // Makes total 110
            dbMocks.innerMockPut.mockResolvedValue(101);

            // ACT
            const result = await updateFrameStat({ ...initialCells }, key, percent);

            // ASSERT
            const total = 60 + 40 + 10 + 0 + 0; // 110
            expect(result.broodPercent).toBe(Math.floor(100 * 60 / total));
            expect(result.honeyPercent).toBe(Math.floor(100 * 40 / total));
            expect(result.pollenPercent).toBe(Math.floor(100 * 10 / total));
            expect(result.eggsPercent).toBe(0);
            expect(result.cappedBroodPercent).toBe(0);
            expect(dbMocks.innerMockPut).toHaveBeenCalledTimes(1);
            expect(dbMocks.innerMockPut).toHaveBeenCalledWith(result);
        });

         it('should not normalize if total is <= 100', async () => {
            // ARRANGE
            const initialCells: FrameSideCells = { id: 101, frameSideId: 101, hiveId: 10, broodPercent: 10, honeyPercent: 20, pollenPercent: 5, eggsPercent: 0, cappedBroodPercent: 0 };
            const key = 'honeyPercent';
            const percent = 30; // Makes total 45
            const expectedCells = { ...initialCells, [key]: percent };
            dbMocks.innerMockPut.mockResolvedValue(101);

            // ACT
            const result = await updateFrameStat({ ...initialCells }, key, percent);

            // ASSERT
            expect(result).toEqual(expectedCells);
            expect(dbMocks.innerMockPut).toHaveBeenCalledTimes(1);
            expect(dbMocks.innerMockPut).toHaveBeenCalledWith(expectedCells);
        });

        it('should throw and log error if db.put fails', async () => {
            // ARRANGE
            const initialCells = { ...cells1 };
            const error = new Error('DB Put Error');
            dbMocks.innerMockPut.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');

            // ACT & ASSERT
            await expect(updateFrameStat(initialCells, 'broodPercent', 20)).rejects.toThrow(error);
            expect(dbMocks.innerMockPut).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('updateFrameSideCells', () => {
        it('should call db.put with the cells data', async () => {
            // ARRANGE
            dbMocks.innerMockPut.mockResolvedValue(101);
            // ACT
            await updateFrameSideCells(cells1);
            // ASSERT
            expect(dbMocks.innerMockPut).toHaveBeenCalledTimes(1);
            expect(dbMocks.innerMockPut).toHaveBeenCalledWith(cells1);
        });

        it('should throw and log error if db.put fails', async () => {
            // ARRANGE
            const error = new Error('DB Put Error');
            dbMocks.innerMockPut.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');
            // ACT & ASSERT
            await expect(updateFrameSideCells(cells1)).rejects.toThrow(error);
            expect(dbMocks.innerMockPut).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('deleteCellsByFrameSideIDs', () => {
        it('should call db.where().anyOf().delete()', async () => {
            // ARRANGE
            const ids = [101, 102];
            dbMocks.innerMockDelete.mockResolvedValue(undefined);

            // ACT
            await deleteCellsByFrameSideIDs(ids);

            // ASSERT
            expect(dbMocks.innerMockWhere).toHaveBeenCalledWith('frameSideId');
            expect(dbMocks.innerMockAnyOf).toHaveBeenCalledWith(ids);
            expect(dbMocks.innerMockDelete).toHaveBeenCalledTimes(1);
        });

        it('should throw and log error if db fails', async () => {
            // ARRANGE
            const ids = [101];
            const error = new Error('DB Delete Error');
            dbMocks.innerMockDelete.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');

            // ACT & ASSERT
            await expect(deleteCellsByFrameSideIDs(ids)).rejects.toThrow(error);
            expect(dbMocks.innerMockDelete).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('enrichFramesWithSideCells', () => {
        it('should fetch cells and assign them to frame sides', async () => {
            // ARRANGE
            const inputFrames = [{ ...frame1, leftSide: { id: 101 }, rightSide: { id: 102 } }];
            const ids = [101, 102];
            const dbResult = [cells1, cells2];
            dbMocks.innerMockToArray.mockResolvedValue(dbResult);

            // ACT
            const result = await enrichFramesWithSideCells(inputFrames);

            // ASSERT
            expect(dbMocks.innerMockWhere).toHaveBeenCalledWith('frameSideId');
            expect(dbMocks.innerMockAnyOf).toHaveBeenCalledWith(ids);
            expect(dbMocks.innerMockToArray).toHaveBeenCalledTimes(1);
            expect(result).not.toBeNull();
            expect(result![0].leftSide?.cells).toEqual(cells1);
            expect(result![0].rightSide?.cells).toEqual(cells2);
        });

         it('should handle frames where sides are initially null/undefined', async () => {
            // ARRANGE
            const inputFrames = [{ ...frame1, leftSide: undefined, rightSide: undefined }];
            const ids = [101, 102];
            const dbResult = [cells1, cells2];
            dbMocks.innerMockToArray.mockResolvedValue(dbResult);
            const consoleWarnSpy = vi.spyOn(console, 'warn');

            // ACT
            const result = await enrichFramesWithSideCells(inputFrames);

            // ASSERT
            expect(dbMocks.innerMockWhere).toHaveBeenCalledWith('frameSideId');
            expect(dbMocks.innerMockAnyOf).toHaveBeenCalledWith(ids);
            expect(dbMocks.innerMockToArray).toHaveBeenCalledTimes(1);
            expect(result).not.toBeNull();
            expect(result![0].leftSide).toBeUndefined();
            expect(result![0].rightSide).toBeUndefined();
            expect(consoleWarnSpy).toHaveBeenCalledWith('frame.leftSide is null', expect.any(Object));
            expect(consoleWarnSpy).toHaveBeenCalledWith('frame.rightSide is null', expect.any(Object));
        });

         it('should return original frames if no frameSideIds found', async () => {
            // ARRANGE
            const inputFrames = [{ ...frameNoSides }];
            // ACT
            const result = await enrichFramesWithSideCells(inputFrames);
            // ASSERT
            expect(result).toEqual(inputFrames);
            expect(dbMocks.innerMockWhere).not.toHaveBeenCalled();
        });

        it('should return null and log error if db query fails', async () => {
            // ARRANGE
            const inputFrames = [{ ...frame1, leftSide: { id: 101 }, rightSide: { id: 102 } }];
            const error = new Error('DB Query Error');
            dbMocks.innerMockToArray.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');

            // ACT
            const result = await enrichFramesWithSideCells(inputFrames);

            // ASSERT
            expect(result).toBeNull();
            expect(dbMocks.innerMockToArray).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });
    });

});
