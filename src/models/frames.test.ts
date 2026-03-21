
import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import {
  getFrame,
  getFramesByHive,
  getFrames,
  getFirstEmptyFramePosition,
  countBoxFrames,
  addFrame,
  upsertFrame,
  moveFrame,
  moveFrameBetweenBoxes,
  updateFrame,
  removeFrame,
  isFrameWithSides,
  Frame,
  FrameType,
  frameTypes, // Ensure frameTypes is imported
} from './frames';
import { db, upsertEntityWithNumericID as actualUpsert } from './db'; // Import original db and upsert for mocking
import { getBoxes as actualGetBoxes } from './boxes'; // Import original for mocking

// --- Mock Dependencies ---

// Mock the entire db module, defining mocks inside the factory
vi.mock('./db', async (importOriginal) => {
    const innerMockUpsertEntityWithNumericID = vi.fn();
    const innerMockFrameGet = vi.fn();
    const innerMockFramePut = vi.fn();
    const innerMockFrameDelete = vi.fn();
    const innerMockFrameWhere = vi.fn();
    const innerMockFrameCount = vi.fn();
    const innerMockFrameSortBy = vi.fn();
    const innerMockFrameCollection = { sortBy: innerMockFrameSortBy, count: innerMockFrameCount };
    innerMockFrameWhere.mockReturnValue(innerMockFrameCollection);
    const innerMockFrameSidePut = vi.fn();

    const original = await importOriginal() as any;
    return {
        ...original,
        upsertEntityWithNumericID: innerMockUpsertEntityWithNumericID,
        db: {
            frame: {
                get: innerMockFrameGet,
                put: innerMockFramePut,
                delete: innerMockFrameDelete,
                where: innerMockFrameWhere,
                // count/sortBy are chained from where
            },
            frameside: {
                put: innerMockFrameSidePut,
            },
             // Expose inner mocks for test access
            __mocks: {
                mockUpsertEntityWithNumericID: innerMockUpsertEntityWithNumericID,
                mockFrameGet: innerMockFrameGet, mockFramePut: innerMockFramePut, mockFrameDelete: innerMockFrameDelete,
                mockFrameWhere: innerMockFrameWhere, mockFrameCount: innerMockFrameCount, mockFrameSortBy: innerMockFrameSortBy,
                mockFrameCollection: innerMockFrameCollection, mockFrameSidePut: innerMockFrameSidePut
            }
        }
    };
});

// Mock functions from './boxes'
vi.mock('./boxes', () => ({
    getBoxes: vi.fn(),
}));

// Import mocks *after* vi.mock calls
const dbMocks = (db as any).__mocks as {
    mockUpsertEntityWithNumericID: Mock,
    mockFrameGet: Mock, mockFramePut: Mock, mockFrameDelete: Mock,
    mockFrameWhere: Mock, mockFrameCount: Mock, mockFrameSortBy: Mock,
    mockFrameCollection: { sortBy: Mock, count: Mock },
    mockFrameSidePut: Mock
};
import { getBoxes } from './boxes';
const mockGetBoxes = getBoxes as Mock;

// Mock functions from './frames' itself for recursive/dependent calls
// Use vi.doMock for dynamic mocking within tests where needed

// --- Test Data ---
// Use valid FrameType values and cast
const frame1: Frame = { id: 1, boxId: 10, position: 1, type: frameTypes.FOUNDATION as FrameType, leftId: 101, rightId: 102 };
const frame2: Frame = { id: 2, boxId: 10, position: 2, type: frameTypes.EMPTY_COMB as FrameType, leftId: 103, rightId: 104 };
const frame3: Frame = { id: 3, boxId: 11, position: 1, type: frameTypes.VOID as FrameType, leftId: 105, rightId: 106 };


describe('Frames Model', () => {

    beforeEach(() => {
        // ARRANGE: Reset mocks
        dbMocks.mockUpsertEntityWithNumericID.mockReset();
        dbMocks.mockFrameGet.mockReset();
        dbMocks.mockFramePut.mockReset();
        dbMocks.mockFrameDelete.mockReset();
        dbMocks.mockFrameWhere.mockReset();
        dbMocks.mockFrameCount.mockReset();
        dbMocks.mockFrameSortBy.mockReset();
        dbMocks.mockFrameSidePut.mockReset();
        mockGetBoxes.mockReset();

        // ARRANGE: Reset chained mocks
        dbMocks.mockFrameWhere.mockReturnValue(dbMocks.mockFrameCollection);
        dbMocks.mockFrameSortBy.mockResolvedValue([]);
        dbMocks.mockFrameCount.mockResolvedValue(0);


        vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
    });

     afterEach(() => {
      vi.restoreAllMocks(); // Restore console.error and any dynamic mocks
    });

    describe('getFrame', () => {
        it('should return frame if found', async () => {
            // ARRANGE
            dbMocks.mockFrameGet.mockResolvedValue(frame1);
            // ACT
            const result = await getFrame(1);
            // ASSERT
            expect(result).toEqual(frame1);
            expect(dbMocks.mockFrameGet).toHaveBeenCalledTimes(1);
            expect(dbMocks.mockFrameGet).toHaveBeenCalledWith({ id: 1 });
        });

        it('should return null if id is invalid', async () => {
            // ACT
            const result = await getFrame(0);
            // ASSERT
            expect(result).toBeNull();
            expect(dbMocks.mockFrameGet).not.toHaveBeenCalled();
        });

        it('should return undefined if frame not found', async () => {
            // ARRANGE
            dbMocks.mockFrameGet.mockResolvedValue(undefined);
            // ACT
            const result = await getFrame(99);
            // ASSERT
            expect(result).toBeUndefined();
            expect(dbMocks.mockFrameGet).toHaveBeenCalledTimes(1);
            expect(dbMocks.mockFrameGet).toHaveBeenCalledWith({ id: 99 });
        });

        it('should log error if db operation fails', async () => {
            // ARRANGE
            const error = new Error('DB Error');
            dbMocks.mockFrameGet.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');
            // ACT
            const result = await getFrame(1); // Function catches error
            // ASSERT
            expect(result).toBeUndefined();
            expect(dbMocks.mockFrameGet).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error, { id: 1 });
        });
    });

    describe('getFramesByHive', () => {
        // ARRANGE: Use static mocks where possible
        const mockGetFrames = vi.fn(); // Keep a reference if needed for assertions


         it('should return empty array if no boxes found', async () => {
            // ARRANGE
            const hiveId = 10;
            mockGetBoxes.mockResolvedValue([]);

            // ACT
            const { getFramesByHive: getFramesByHiveWithMock } = await import('./frames');
            const result = await getFramesByHiveWithMock(hiveId);

            // ASSERT
            expect(mockGetBoxes).toHaveBeenCalledWith({ hiveId: hiveId });
            expect(mockGetFrames).not.toHaveBeenCalled();
            expect(result).toEqual([]);
        });

        it('should collect and flatten frames from all boxes in hive order', async () => {
            // ARRANGE
            const hiveId = 10;
            mockGetBoxes.mockResolvedValue([{ id: 10 }, { id: 11 }]);
            dbMocks.mockFrameSortBy
                .mockResolvedValueOnce([frame1, frame2])
                .mockResolvedValueOnce([frame3]);

            // ACT
            const result = await getFramesByHive(hiveId);

            // ASSERT
            expect(mockGetBoxes).toHaveBeenCalledWith({ hiveId });
            expect(dbMocks.mockFrameWhere).toHaveBeenNthCalledWith(1, { boxId: 10 });
            expect(dbMocks.mockFrameWhere).toHaveBeenNthCalledWith(2, { boxId: 11 });
            expect(result).toEqual([frame1, frame2, frame3]);
        });
    });

    describe('getFrames', () => {
        it('should call db.frame.where(where).sortBy()', async () => {
            // ARRANGE
            const whereClause = { boxId: 10 };
            dbMocks.mockFrameSortBy.mockResolvedValue([frame1, frame2]);
            // ACT
            const result = await getFrames(whereClause);
            // ASSERT
            expect(result).toEqual([frame1, frame2]);
            expect(dbMocks.mockFrameWhere).toHaveBeenCalledWith(whereClause);
            expect(dbMocks.mockFrameSortBy).toHaveBeenCalledWith('position');
        });

        it('should return null and log error if db fails', async () => {
            // ARRANGE
            const error = new Error('DB Error');
            dbMocks.mockFrameSortBy.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');
            // ACT
            const result = await getFrames({ boxId: 1 });
            // ASSERT
            expect(result).toBeNull();
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });

        it('should return [] when where clause is null', async () => {
            // ACT
            const result = await getFrames(null as any);

            // ASSERT
            expect(result).toEqual([]);
            expect(dbMocks.mockFrameWhere).not.toHaveBeenCalled();
        });
    });

    describe('countBoxFrames', () => {
        it('should call db.frame.where({boxId}).count()', async () => {
            // ARRANGE
            const boxId = 10;
            dbMocks.mockFrameCount.mockResolvedValue(5);
            // ACT
            const result = await countBoxFrames(boxId);
            // ASSERT
            expect(result).toBe(5);
            expect(dbMocks.mockFrameWhere).toHaveBeenCalledWith({ boxId });
            expect(dbMocks.mockFrameCount).toHaveBeenCalledTimes(1);
        });

        it('should throw and log error if db fails', async () => {
            // ARRANGE
            const error = new Error('DB Error');
            dbMocks.mockFrameCount.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');
            // ACT & ASSERT
            await expect(countBoxFrames(1)).rejects.toThrow(error);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('getFirstEmptyFramePosition', () => {
        it('should return first gap when positions have a hole', async () => {
            // ARRANGE
            dbMocks.mockFrameSortBy.mockResolvedValue([
                { ...frame1, position: 1 },
                { ...frame2, position: 2 },
                { ...frame3, position: 4 },
            ]);

            // ACT
            const result = await getFirstEmptyFramePosition(10);

            // ASSERT
            expect(result).toBe(3);
            expect(dbMocks.mockFrameWhere).toHaveBeenCalledWith({ boxId: 10 });
            expect(dbMocks.mockFrameSortBy).toHaveBeenCalledWith('position');
        });

        it('should return 1 when the first occupied position starts later', async () => {
            // ARRANGE
            dbMocks.mockFrameSortBy.mockResolvedValue([
                { ...frame1, position: 2 },
                { ...frame2, position: 3 },
            ]);

            // ACT
            const result = await getFirstEmptyFramePosition(10);

            // ASSERT
            expect(result).toBe(1);
        });

        it('should return next position when no gaps exist', async () => {
            // ARRANGE
            dbMocks.mockFrameSortBy.mockResolvedValue([
                { ...frame1, position: 1 },
                { ...frame2, position: 2 },
                { ...frame3, position: 3 },
            ]);

            // ACT
            const result = await getFirstEmptyFramePosition(10);

            // ASSERT
            expect(result).toBe(4);
        });

        it('should ignore invalid positions and still return first empty position', async () => {
            // ARRANGE
            dbMocks.mockFrameSortBy.mockResolvedValue([
                { ...frame1, position: -1 },
                { ...frame2, position: 'abc' as any },
                { ...frame3, position: 2 },
            ]);

            // ACT
            const result = await getFirstEmptyFramePosition(10);

            // ASSERT
            expect(result).toBe(1);
        });

        it('should return 1 if loading frames fails (fallback behavior)', async () => {
            // ARRANGE
            const error = new Error('Get Frames Failed');
            dbMocks.mockFrameSortBy.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');

            // ACT
            const result = await getFirstEmptyFramePosition(10);

            // ASSERT
            expect(result).toBe(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('addFrame', () => {
        it('should put framesides (if IDs exist) and frame', async () => {
            // ARRANGE
            const frameData = { id: 4, position: 1, boxId: 12, type: frameTypes.FOUNDATION, leftId: 201, rightId: 202 };
            dbMocks.mockFrameSidePut.mockResolvedValue(undefined);
            dbMocks.mockFramePut.mockResolvedValue(4);

            // ACT
            await addFrame(frameData);

            // ASSERT
            expect(dbMocks.mockFrameSidePut).toHaveBeenCalledTimes(2);
            expect(dbMocks.mockFrameSidePut).toHaveBeenCalledWith({ id: 201 });
            expect(dbMocks.mockFrameSidePut).toHaveBeenCalledWith({ id: 202 });
            expect(dbMocks.mockFramePut).toHaveBeenCalledTimes(1);
            expect(dbMocks.mockFramePut).toHaveBeenCalledWith({
                id: 4, position: 1, boxId: 12, type: frameTypes.FOUNDATION, leftId: 201, rightId: 202
            });
        });

         it('should only put frame if side IDs are missing', async () => {
            // ARRANGE
            const frameData = { id: 5, position: 2, boxId: 12, type: frameTypes.VOID, leftId: null, rightId: undefined };
            dbMocks.mockFramePut.mockResolvedValue(5);

            // ACT
            await addFrame(frameData);

            // ASSERT
            expect(dbMocks.mockFrameSidePut).not.toHaveBeenCalled();
            expect(dbMocks.mockFramePut).toHaveBeenCalledTimes(1);
            expect(dbMocks.mockFramePut).toHaveBeenCalledWith({
                id: 5, position: 2, boxId: 12, type: frameTypes.VOID, leftId: null, rightId: undefined
            });
        });

        it('should throw and log error if frameside put fails', async () => {
            // ARRANGE
            const frameData = { id: 6, position: 1, boxId: 13, type: frameTypes.FOUNDATION, leftId: 301, rightId: 302 };
            const error = new Error('Frameside Put Error');
            dbMocks.mockFrameSidePut.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');

            // ACT & ASSERT
            await expect(addFrame(frameData)).rejects.toThrow(error);
            expect(dbMocks.mockFrameSidePut).toHaveBeenCalledTimes(1);
            expect(dbMocks.mockFramePut).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });

         it('should throw and log error if frame put fails', async () => {
            // ARRANGE
            const frameData = { id: 7, position: 1, boxId: 14, type: frameTypes.FOUNDATION, leftId: 401, rightId: 402 };
            const error = new Error('Frame Put Error');
            dbMocks.mockFrameSidePut.mockResolvedValue(undefined);
            dbMocks.mockFramePut.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');

            // ACT & ASSERT
            await expect(addFrame(frameData)).rejects.toThrow(error);
            expect(dbMocks.mockFrameSidePut).toHaveBeenCalledTimes(2);
            expect(dbMocks.mockFramePut).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('upsertFrame', () => {
        it('should call upsertEntityWithNumericID', async () => {
            // ARRANGE
            dbMocks.mockUpsertEntityWithNumericID.mockResolvedValue(undefined);
            // ACT
            await upsertFrame(frame1);
            // ASSERT
            expect(dbMocks.mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
            expect(dbMocks.mockUpsertEntityWithNumericID).toHaveBeenCalledWith('frame', frame1);
        });

         it('should propagate errors', async () => {
            // ARRANGE
            const error = new Error('Upsert Error');
            dbMocks.mockUpsertEntityWithNumericID.mockRejectedValue(error);
            // ACT & ASSERT
            await expect(upsertFrame(frame1)).rejects.toThrow(error);
            expect(dbMocks.mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateFrame', () => {
        it('should call db.frame.put with data', async () => {
            // ARRANGE
            dbMocks.mockFramePut.mockResolvedValue(1);
            // ACT
            await updateFrame(frame1);
            // ASSERT
            expect(dbMocks.mockFramePut).toHaveBeenCalledTimes(1);
            expect(dbMocks.mockFramePut).toHaveBeenCalledWith(frame1);
        });

        it('should throw and log error if db fails', async () => {
            // ARRANGE
            const error = new Error('DB Error');
            dbMocks.mockFramePut.mockRejectedValue(error);
            const consoleErrorSpy = vi.spyOn(console, 'error');
            // ACT & ASSERT
            await expect(updateFrame(frame1)).rejects.toThrow(error);
            expect(dbMocks.mockFramePut).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith(error);
        });
    });

    describe('moveFrame', () => {
        it('should reorder frame positions inside a box', async () => {
            // ARRANGE
            dbMocks.mockFrameSortBy.mockResolvedValue([
                { ...frame1, position: 1 },
                { ...frame2, position: 2 },
                { ...frame3, position: 3, boxId: 10 },
            ]);

            // ACT
            await moveFrame({ boxId: 10, removedIndex: 1, addedIndex: 0 });

            // ASSERT
            expect(dbMocks.mockFramePut).toHaveBeenCalledTimes(3);
            const updatedFrames = dbMocks.mockFramePut.mock.calls.map((call) => call[0]).sort((a, b) => a.id - b.id);
            expect(updatedFrames).toEqual([
                expect.objectContaining({ id: 1, position: 2 }),
                expect.objectContaining({ id: 2, position: 1 }),
                expect.objectContaining({ id: 3, position: 3 }),
            ]);
        });

        it('should keep removed frame at -1 when addedIndex is null', async () => {
            // ARRANGE
            dbMocks.mockFrameSortBy.mockResolvedValue([
                { ...frame1, position: 1 },
                { ...frame2, position: 2 },
            ]);

            // ACT
            await moveFrame({ boxId: 10, removedIndex: 0, addedIndex: null as any });

            // ASSERT
            const updatedFrames = dbMocks.mockFramePut.mock.calls.map((call) => call[0]).sort((a, b) => a.id - b.id);
            expect(updatedFrames).toEqual([
                expect.objectContaining({ id: 1, position: -1 }),
                expect.objectContaining({ id: 2, position: 1 }),
            ]);
        });
    });

    describe('moveFrameBetweenBoxes', () => {
        it('should move frame between boxes and reindex both sides', async () => {
            // ARRANGE
            dbMocks.mockFrameSortBy
                .mockResolvedValueOnce([
                    { id: 1, boxId: 10, position: 1, type: frameTypes.FOUNDATION, leftId: 1, rightId: 2 },
                    { id: 2, boxId: 10, position: 2, type: frameTypes.FOUNDATION, leftId: 3, rightId: 4 },
                ])
                .mockResolvedValueOnce([
                    { id: 3, boxId: 11, position: 1, type: frameTypes.VOID, leftId: 5, rightId: 6 },
                ]);

            // ACT
            await moveFrameBetweenBoxes({
                fromBoxId: 10,
                toBoxId: 11,
                removedIndex: 1,
                addedIndex: 5,
            });

            // ASSERT
            const updates = dbMocks.mockFramePut.mock.calls.map((call) => call[0]).sort((a, b) => a.id - b.id);
            expect(updates).toEqual([
                expect.objectContaining({ id: 1, boxId: 10, position: 1 }),
                expect.objectContaining({ id: 2, boxId: 11, position: 2 }),
                expect.objectContaining({ id: 3, boxId: 11, position: 1 }),
            ]);
        });

        it('should no-op on invalid removedIndex', async () => {
            // ARRANGE
            dbMocks.mockFrameSortBy
                .mockResolvedValueOnce([{ ...frame1, boxId: 10, position: 1 }])
                .mockResolvedValueOnce([{ ...frame2, boxId: 11, position: 1 }]);

            // ACT
            await moveFrameBetweenBoxes({
                fromBoxId: 10,
                toBoxId: 11,
                removedIndex: 3,
                addedIndex: 0,
            });

            // ASSERT
            expect(dbMocks.mockFramePut).not.toHaveBeenCalled();
        });
    });

    describe('removeFrame', () => {
        it('should delete frame when it exists', async () => {
            // ARRANGE
            dbMocks.mockFrameGet.mockResolvedValue(frame1);
            dbMocks.mockFrameDelete.mockResolvedValue(undefined);

            // ACT
            await removeFrame(1, 10);

            // ASSERT
            expect(dbMocks.mockFrameGet).toHaveBeenCalledWith({ id: 1 });
            expect(dbMocks.mockFrameDelete).toHaveBeenCalledWith(1);
        });

        it('should throw when frame does not exist', async () => {
            // ARRANGE
            dbMocks.mockFrameGet.mockResolvedValue(undefined);

            // ACT & ASSERT
            await expect(removeFrame(123, 10)).rejects.toThrow('Frame with id 123 not found. Cannot remove.');
            expect(dbMocks.mockFrameDelete).not.toHaveBeenCalled();
        });
    });

    describe('isFrameWithSides', () => {
        it('should return true for EMPTY_COMB, FOUNDATION, VOID', () => {
            // ACT & ASSERT
            expect(isFrameWithSides(frameTypes.EMPTY_COMB)).toBe(true);
            expect(isFrameWithSides(frameTypes.FOUNDATION)).toBe(true);
            expect(isFrameWithSides(frameTypes.VOID)).toBe(true);
        });

        it('should return false for FEEDER, PARTITION, other types', () => {
             // ACT & ASSERT
            expect(isFrameWithSides(frameTypes.FEEDER)).toBe(false);
            expect(isFrameWithSides(frameTypes.PARTITION)).toBe(false);
            expect(isFrameWithSides('UNKNOWN' as FrameType)).toBe(false);
            expect(isFrameWithSides(null as any)).toBe(false);
        });
    });

});
