import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import { FRAME_SIDE_FILE_TABLE } from './frameSideFile'; // Import constant needed for mock

// Use vi.hoisted to define mocks before vi.mock runs
const mocks = vi.hoisted(() => {
    const innerMockGet = vi.fn();
    const innerMockPut = vi.fn();
    const innerMockWhere = vi.fn();
    const innerMockAnyOf = vi.fn();
    const innerMockDelete = vi.fn();
    const innerMockModify = vi.fn();
    const innerMockUpsertEntityWithNumericID = vi.fn(); // Hoist this too

    const innerMockCollectionModify = { modify: innerMockModify };
    const innerMockCollectionDelete = { anyOf: innerMockAnyOf.mockReturnThis(), delete: innerMockDelete };

    // Setup mock implementation using hoisted mocks
    innerMockWhere.mockImplementation((query) => {
        if (query && query.id !== undefined) return innerMockCollectionModify;
        if (query === 'frameSideId') return innerMockCollectionDelete;
        return { modify: innerMockModify, delete: innerMockDelete, anyOf: innerMockAnyOf.mockReturnThis() };
    });

    return {
        innerMockGet, innerMockPut, innerMockWhere, innerMockAnyOf,
        innerMockDelete, innerMockModify, innerMockUpsertEntityWithNumericID,
        innerMockCollectionModify, innerMockCollectionDelete
    };
});


// Mock the db module using the hoisted mocks
vi.mock('./db', async (importOriginal) => {
    const original = await importOriginal() as any;
    return {
        ...original,
        // Use hoisted mock for upsertEntityWithNumericID
        upsertEntityWithNumericID: mocks.innerMockUpsertEntityWithNumericID,
        db: {
            ["frame_side_file"]: { // Use constant for table name
                get: mocks.innerMockGet,
                put: mocks.innerMockPut,
                where: mocks.innerMockWhere,
            },
            // Expose inner mocks for test access using hoisted mocks
            __mocks: {
                mockUpsertEntityWithNumericID: mocks.innerMockUpsertEntityWithNumericID,
                mockGet: mocks.innerMockGet, mockPut: mocks.innerMockPut, mockWhere: mocks.innerMockWhere,
                mockAnyOf: mocks.innerMockAnyOf, mockDelete: mocks.innerMockDelete, mockModify: mocks.innerMockModify,
                mockCollectionModify: mocks.innerMockCollectionModify,
                mockCollectionDelete: mocks.innerMockCollectionDelete
            }
        }
    };
});

// Now import the modules after the mock is set up
import { db } from './db'; // Import db normally

import frameSideFileModel, { // Import default export
  getFrameSideFile,
  updateFrameSideFile,
  appendBeeDetectionData,
  appendQueenDetectionData,
  appendResourceDetectionData,
  appendQueenCupDetectionData,
  updateStrokeHistoryData,
  deleteFilesByFrameSideIDs,
  FrameSideFile,
  // FRAME_SIDE_FILE_TABLE // Already imported above
  // Import interfaces if needed for casting test data
  // BeeDetectionPayload, QueenDetectionPayload, ResourceDetectionPayload, QueenCupDetectionPayload
} from './frameSideFile';


// --- Test Data ---
const baseFile: FrameSideFile = {
    id: 101, // Should be same as frameSideId
    fileId: 501,
    frameSideId: 101,
    hiveId: 10,
    strokeHistory: [],
    detectedBees: [],
    detectedCells: [],
    detectedQueenCups: [],
    detectedVarroa: [],
    detectedQueenCount: 0,
    detectedWorkerBeeCount: 0,
    detectedDroneCount: 0,
    varroaCount: 0,
    counts: {},
};


describe('FrameSideFile Model', () => {

    // Define mocks access and helpers inside describe block
    let dbMocks: typeof mocks; // Type based on hoisted mocks
    let simulateModify: (initialState: Partial<FrameSideFile> | null) => Promise<Partial<FrameSideFile>>;


    beforeEach(() => {
        // Get typed access to the inner mocks using the hoisted 'mocks' object
        dbMocks = mocks;

        // Helper to simulate Dexie modify using hoisted mocks
        simulateModify = async (initialState: Partial<FrameSideFile> | null) => {
            const modifyCallback = dbMocks.innerMockModify.mock.calls[0][0]; // Use hoisted mock
            const stateToModify = initialState ? { ...initialState } : {};
            await modifyCallback(stateToModify);
            return stateToModify;
        };


        // ARRANGE: Reset inner mocks using dbMocks reference
        dbMocks.innerMockUpsertEntityWithNumericID.mockReset();
        dbMocks.innerMockGet.mockReset();
        dbMocks.innerMockPut.mockReset();
        dbMocks.innerMockWhere.mockReset();
        dbMocks.innerMockAnyOf.mockReset();
        dbMocks.innerMockDelete.mockReset();
        dbMocks.innerMockModify.mockReset();

        // ARRANGE: Reset chained mocks (re-apply implementation using hoisted mocks)
        dbMocks.innerMockWhere.mockImplementation((query) => {
            if (query && query.id !== undefined) return dbMocks.innerMockCollectionModify;
            if (query === 'frameSideId') return dbMocks.innerMockCollectionDelete;
            return { modify: dbMocks.innerMockModify, delete: dbMocks.innerMockDelete, anyOf: dbMocks.innerMockAnyOf.mockReturnThis() };
        });
        dbMocks.innerMockAnyOf.mockReturnThis();
        dbMocks.innerMockDelete.mockResolvedValue(undefined);

        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

     afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('getFrameSideFile', () => {
        it('should call db.get and return row', async () => {
            // ARRANGE
            dbMocks.innerMockGet.mockResolvedValue({ ...baseFile });
            // ACT
            const result = await getFrameSideFile({ frameSideId: 101 });
            // ASSERT
            expect(result).toEqual(baseFile);
            expect(dbMocks.innerMockGet).toHaveBeenCalledTimes(1);
            expect(dbMocks.innerMockGet).toHaveBeenCalledWith(101);
        });

        it('should initialize empty arrays if missing', async () => {
            // ARRANGE
            const fileWithoutArrays = { id: 101, fileId: 501, frameSideId: 101 };
            dbMocks.innerMockGet.mockResolvedValue(fileWithoutArrays);
            // ACT
            const result = await getFrameSideFile({ frameSideId: 101 });
            // ASSERT
            expect(result?.detectedBees).toEqual([]);
            expect(result?.detectedCells).toEqual([]);
            expect(result?.detectedQueenCups).toEqual([]);
            expect(result?.detectedVarroa).toEqual([]);
        });


        it('should return null and log error if db fails', async () => {
            // ARRANGE
            const error = new Error('DB Error');
            dbMocks.innerMockGet.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');
            // ACT
            const result = await getFrameSideFile({ frameSideId: 101 });
            // ASSERT
            expect(result).toBeNull();
            expect(dbMocks.innerMockGet).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error, { frameSideId: 101 });
        });
    });

    describe('updateFrameSideFile', () => {
        it('should call db.put with data', async () => {
            // ARRANGE
            const data = { ...baseFile, detectedQueenCount: 1 };
            dbMocks.innerMockPut.mockResolvedValue(101);
            // ACT
            await updateFrameSideFile(data);
            // ASSERT
            expect(dbMocks.innerMockPut).toHaveBeenCalledTimes(1);
            expect(dbMocks.innerMockPut).toHaveBeenCalledWith(data);
        });

        it('should throw and log error if db fails', async () => {
            // ARRANGE
            const error = new Error('DB Error');
            dbMocks.innerMockPut.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');
            // ACT & ASSERT
            await expect(updateFrameSideFile(baseFile)).rejects.toThrow(error);
            expect(dbMocks.innerMockPut).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('appendBeeDetectionData', () => {
        const frameSideId = 101;
        const bee1 = { x: 1, y: 1, n: 'W' }; // Worker
        const bee2 = { x: 2, y: 2, n: 'D' }; // Drone
        const bee3 = { x: 3, y: 3, n: 'Q' }; // Queen

        it('should initialize array, append delta, and update counts/flag', async () => {
            // ARRANGE
            const payload = { delta: [bee1, bee2], detectedQueenCount: 0, detectedWorkerBeeCount: 1, detectedDroneCount: 1, isBeeDetectionComplete: false };
            dbMocks.innerMockModify.mockImplementation(async (callback) => {
                const state: Partial<FrameSideFile> = { id: frameSideId, detectedBees: undefined };
                await callback(state);
                // ASSERT inside mock
                expect(state.detectedBees).toEqual([bee1, bee2]);
                expect(state.detectedQueenCount).toBe(0);
                expect(state.detectedWorkerBeeCount).toBe(1);
                expect(state.detectedDroneCount).toBe(1);
                expect(state.isBeeDetectionComplete).toBe(false);
            });

            // ACT
            await appendBeeDetectionData(frameSideId, payload);

            // ASSERT
            expect(dbMocks.innerMockWhere).toHaveBeenCalledWith({ id: frameSideId });
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
        });

        it('should append unique bees from delta to existing array', async () => {
            // ARRANGE
            const initialState = { ...baseFile, detectedBees: [bee1] };
            const payload = { delta: [bee1, bee2], detectedQueenCount: 0, detectedWorkerBeeCount: 1, detectedDroneCount: 1, isBeeDetectionComplete: true };
             dbMocks.innerMockModify.mockImplementation(async (callback) => {
                const state = { ...initialState };
                await callback(state);
                 // ASSERT inside mock
                expect(state.detectedBees).toEqual([bee1, bee2]);
                expect(state.isBeeDetectionComplete).toBe(true);
                expect(state.detectedWorkerBeeCount).toBe(1);
                expect(state.detectedDroneCount).toBe(1);
            });

            // ACT
            await appendBeeDetectionData(frameSideId, payload);

            // ASSERT
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
        });

         it('should handle empty or null delta', async () => {
            // ARRANGE
            const initialState = { ...baseFile, detectedBees: [bee1] };
            const payload = { delta: [], detectedQueenCount: 0, detectedWorkerBeeCount: 1, detectedDroneCount: 0, isBeeDetectionComplete: true };
             dbMocks.innerMockModify.mockImplementation(async (callback) => {
                const state = { ...initialState };
                await callback(state);
                 // ASSERT inside mock
                expect(state.detectedBees).toEqual([bee1]);
                expect(state.isBeeDetectionComplete).toBe(true);
                expect(state.detectedWorkerBeeCount).toBe(1);
                expect(state.detectedDroneCount).toBe(0);
            });

            // ACT
            await appendBeeDetectionData(frameSideId, payload);

            // ASSERT
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
        });

        it('should throw and log error if modify fails', async () => {
            // ARRANGE
            const error = new Error('Modify Error');
            dbMocks.innerMockModify.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');
            const payload = { delta: [bee1], detectedQueenCount: 0, detectedWorkerBeeCount: 1, detectedDroneCount: 0, isBeeDetectionComplete: false };

            // ACT & ASSERT
            await expect(appendBeeDetectionData(frameSideId, payload)).rejects.toThrow(error);
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error appending bee detection data:", error, { frameSideId, payload });
        });
    });

     describe('appendQueenDetectionData', () => {
        const frameSideId = 102;
        const queen1 = { x: 5, y: 5, n: 'Q' };
        const queen2 = { x: 6, y: 6, n: 'Q' };

         it('should add unique queen, increment count, set flags', async () => {
            // ARRANGE
            const payload = { delta: [queen1], isQueenDetectionComplete: false };
             dbMocks.innerMockModify.mockImplementation(async (callback) => {
                const state: Partial<FrameSideFile> = { id: frameSideId, detectedBees: undefined, detectedQueenCount: 0, queenDetected: false };
                await callback(state);
                // ASSERT inside mock
                expect(state.detectedBees).toEqual([queen1]);
                expect(state.detectedQueenCount).toBe(1);
                expect(state.queenDetected).toBe(true);
                expect(state.isQueenDetectionComplete).toBe(false);
            });
            // ACT
            await appendQueenDetectionData(frameSideId, payload);
            // ASSERT
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
        });

         it('should not add duplicate queen, not increment count, update flags', async () => {
            // ARRANGE
            const initialState = { ...baseFile, id: frameSideId, detectedBees: [queen1], detectedQueenCount: 1, queenDetected: true };
            const payload = { delta: [queen1], isQueenDetectionComplete: true };
             dbMocks.innerMockModify.mockImplementation(async (callback) => {
                const state = { ...initialState };
                await callback(state);
                 // ASSERT inside mock
                expect(state.detectedBees).toEqual([queen1]);
                expect(state.detectedQueenCount).toBe(1);
                expect(state.queenDetected).toBe(true);
                expect(state.isQueenDetectionComplete).toBe(true);
            });
            // ACT
            await appendQueenDetectionData(frameSideId, payload);
            // ASSERT
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
        });

         it('should add unique queen to existing list, increment count', async () => {
            // ARRANGE
            const initialState = { ...baseFile, id: frameSideId, detectedBees: [queen1], detectedQueenCount: 1, queenDetected: true };
            const payload = { delta: [queen2], isQueenDetectionComplete: true };
             dbMocks.innerMockModify.mockImplementation(async (callback) => {
                const state = { ...initialState };
                await callback(state);
                 // ASSERT inside mock
                expect(state.detectedBees).toEqual([queen1, queen2]);
                expect(state.detectedQueenCount).toBe(2);
                expect(state.queenDetected).toBe(true);
                expect(state.isQueenDetectionComplete).toBe(true);
            });
            // ACT
            await appendQueenDetectionData(frameSideId, payload);
            // ASSERT
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
        });

         it('should handle empty delta', async () => {
            // ARRANGE
            const initialState = { ...baseFile, id: frameSideId, detectedBees: [queen1], detectedQueenCount: 1, queenDetected: true };
            const payload = { delta: [], isQueenDetectionComplete: true };
             dbMocks.innerMockModify.mockImplementation(async (callback) => {
                const state = { ...initialState };
                await callback(state);
                 // ASSERT inside mock
                expect(state.detectedBees).toEqual([queen1]);
                expect(state.detectedQueenCount).toBe(1);
                expect(state.queenDetected).toBe(true);
                expect(state.isQueenDetectionComplete).toBe(true);
            });
            // ACT
            await appendQueenDetectionData(frameSideId, payload);
            // ASSERT
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
        });

        it('should throw and log error if modify fails', async () => {
            // ARRANGE
            const error = new Error('Modify Error');
            dbMocks.innerMockModify.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');
            const payload = { delta: [queen1], isQueenDetectionComplete: false };

            // ACT & ASSERT
            await expect(appendQueenDetectionData(frameSideId, payload)).rejects.toThrow(error);
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error appending queen detection data:", error, { frameSideId, payload });
        });
    });

    describe('appendResourceDetectionData', () => {
        const frameSideId = 103;
        const cell1 = { x: 1, y: 1, t: 'H' }; // Honey
        const cell2 = { x: 2, y: 2, t: 'B' }; // Brood

         it('should initialize array, append delta, update flags and percentages', async () => {
            // ARRANGE
            const payload = { delta: [cell1], isCellsDetectionComplete: false, broodPercent: 10, cappedBroodPercent: 1, eggsPercent: 2, pollenPercent: 3, honeyPercent: 4 };
             dbMocks.innerMockModify.mockImplementation(async (callback) => {
                // Cast state to any to allow adding percentage properties, reflecting current code behavior
                const state: any = { id: frameSideId, detectedCells: undefined };
                await callback(state);
                 // ASSERT inside mock
                expect(state.detectedCells).toEqual([cell1]); // Initialized and populated
                expect(state.isCellsDetectionComplete).toBe(false);
                expect(state.broodPercent).toBe(10);
                expect(state.cappedBroodPercent).toBe(1);
                expect(state.eggsPercent).toBe(2);
                expect(state.pollenPercent).toBe(3);
                expect(state.honeyPercent).toBe(4);
            });
            // ACT
            await appendResourceDetectionData(frameSideId, payload);
            // ASSERT
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
        });

         it('should append delta to existing array', async () => {
            // ARRANGE
            const initialState = { ...baseFile, id: frameSideId, detectedCells: [cell1] };
            const payload = { delta: [cell2], isCellsDetectionComplete: true, broodPercent: 15, cappedBroodPercent: 2, eggsPercent: 3, pollenPercent: 4, honeyPercent: 5 };
             dbMocks.innerMockModify.mockImplementation(async (callback) => {
                // Cast state to any to allow checking percentage properties added by the callback
                const state: any = { ...initialState };
                await callback(state);
                 // ASSERT inside mock
                expect(state.detectedCells).toEqual([cell1, cell2]);
                expect(state.isCellsDetectionComplete).toBe(true);
                expect(state.broodPercent).toBe(15);
                expect(state.cappedBroodPercent).toBe(2);
                expect(state.eggsPercent).toBe(3);
                expect(state.pollenPercent).toBe(4);
                expect(state.honeyPercent).toBe(5);
            });
            // ACT
            await appendResourceDetectionData(frameSideId, payload);
            // ASSERT
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
        });

        it('should throw and log error if modify fails', async () => {
            // ARRANGE
            const error = new Error('Modify Error');
            dbMocks.innerMockModify.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');
            const payload = { delta: [cell1], isCellsDetectionComplete: false, broodPercent: 10, cappedBroodPercent: 1, eggsPercent: 2, pollenPercent: 3, honeyPercent: 4 };

            // ACT & ASSERT
            await expect(appendResourceDetectionData(frameSideId, payload)).rejects.toThrow(error);
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error appending resource data:", error, { frameSideId, payload });
        });
    });

     describe('appendQueenCupDetectionData', () => {
        const frameSideId = 104;
        const cup1 = { x: 10, y: 10 };
        const cup2 = { x: 11, y: 11 };

         it('should initialize array, append delta, update flag', async () => {
            // ARRANGE
            const payload = { delta: [cup1], isQueenCupsDetectionComplete: false };
             dbMocks.innerMockModify.mockImplementation(async (callback) => {
                const state: Partial<FrameSideFile> = { id: frameSideId, detectedQueenCups: undefined };
                await callback(state);
                 // ASSERT inside mock
                expect(state.detectedQueenCups).toEqual([cup1]);
                expect(state.isQueenCupsDetectionComplete).toBe(false);
            });
            // ACT
            await appendQueenCupDetectionData(frameSideId, payload);
            // ASSERT
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
        });

         it('should append delta to existing array', async () => {
            // ARRANGE
            const initialState = { ...baseFile, id: frameSideId, detectedQueenCups: [cup1] };
            const payload = { delta: [cup2], isQueenCupsDetectionComplete: true };
             dbMocks.innerMockModify.mockImplementation(async (callback) => {
                const state = { ...initialState };
                await callback(state);
                 // ASSERT inside mock
                expect(state.detectedQueenCups).toEqual([cup1, cup2]);
                expect(state.isQueenCupsDetectionComplete).toBe(true);
            });
             // ACT
            await appendQueenCupDetectionData(frameSideId, payload);
             // ASSERT
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
        });

        it('should throw and log error if modify fails', async () => {
            // ARRANGE
            const error = new Error('Modify Error');
            dbMocks.innerMockModify.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');
            const payload = { delta: [cup1], isQueenCupsDetectionComplete: false };

            // ACT & ASSERT
            await expect(appendQueenCupDetectionData(frameSideId, payload)).rejects.toThrow(error);
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error appending queen cup data:", error, { frameSideId, payload });
        });
    });

    describe('updateStrokeHistoryData', () => {
        const frameSideId = 105;
        const history = [{ type: 'line', points: [1, 1, 2, 2] }];

        it('should update strokeHistory field', async () => {
            // ARRANGE
             dbMocks.innerMockModify.mockImplementation(async (callback) => {
                const state = { id: frameSideId, strokeHistory: [] }; // Initial state
                await callback(state);
                 // ASSERT inside mock
                expect(state.strokeHistory).toEqual(history);
            });
            // ACT
            await updateStrokeHistoryData(frameSideId, history);
            // ASSERT
            expect(dbMocks.innerMockWhere).toHaveBeenCalledWith({ id: frameSideId });
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
        });

        it('should throw and log error if modify fails', async () => {
            // ARRANGE
            const error = new Error('Modify Error');
            dbMocks.innerMockModify.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');

            // ACT & ASSERT
            await expect(updateStrokeHistoryData(frameSideId, history)).rejects.toThrow(error);
            expect(dbMocks.innerMockModify).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith("Error updating stroke history:", error, { frameSideId });
        });
    });

    describe('deleteFilesByFrameSideIDs', () => {
        it('should call db.where(frameSideId).anyOf(ids).delete()', async () => {
            // ARRANGE
            const ids = [101, 102];
            dbMocks.innerMockDelete.mockResolvedValue(undefined); // delete returns void

            // ACT
            await deleteFilesByFrameSideIDs(ids);

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
            await expect(deleteFilesByFrameSideIDs(ids)).rejects.toThrow(error);
            expect(dbMocks.innerMockDelete).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('Default Export: upsertEntity', () => {
        it('should process entity and call upsertEntityWithNumericID', async () => {
            // ARRANGE
            const entity = { frameSideId: '101', fileId: '501', hiveId: 10 }; // hiveId should be deleted
            const originalValue = { file: { id: '501' }, detectedCells: ['cell_data'] };
            const expectedEntity = {
                id: 101, // Set to frameSideId (numeric)
                frameSideId: 101,
                fileId: 501,
                detectedCells: ['cell_data'],
                // hiveId is deleted
            };
            dbMocks.innerMockUpsertEntityWithNumericID.mockResolvedValue(undefined);

            // ACT
            await frameSideFileModel.upsertEntity(entity as any, originalValue);

            // ASSERT
            expect(dbMocks.innerMockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
            expect(dbMocks.innerMockUpsertEntityWithNumericID).toHaveBeenCalledWith(FRAME_SIDE_FILE_TABLE, expectedEntity);
        });


        it('should return early if entity is empty', async () => {
            // ACT
            await frameSideFileModel.upsertEntity({} as any, {});
            // ASSERT
            expect(dbMocks.innerMockUpsertEntityWithNumericID).not.toHaveBeenCalled();
        });

        it('should not call upsert if id or fileId is missing/invalid after processing', async () => {
             // ARRANGE: Missing frameSideId -> missing id
             // ACT
            await frameSideFileModel.upsertEntity({ fileId: '501' } as any, { file: { id: '501' } });
            // ASSERT
            expect(dbMocks.innerMockUpsertEntityWithNumericID).not.toHaveBeenCalled();

             // ARRANGE: Missing originalValue.file.id -> NaN fileId
             dbMocks.innerMockUpsertEntityWithNumericID.mockClear();
             // ACT
             await frameSideFileModel.upsertEntity({ frameSideId: '101' } as any, {});
             // ASSERT
             expect(dbMocks.innerMockUpsertEntityWithNumericID).not.toHaveBeenCalled(); // Because fileId is NaN
        });
    });

});
