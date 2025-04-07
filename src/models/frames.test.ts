
import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import {
  getFrame,
  getFramesByHive,
  getFrames,
  countBoxFrames,
  addFrame,
  upsertFrame,
  moveFrame,
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
