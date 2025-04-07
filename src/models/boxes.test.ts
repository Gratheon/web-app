import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import {
  getBox,
  getBoxAtPositionAbove,
  getBoxAtPositionBelow,
  getBoxes,
  maxBoxPosition,
  removeBox,
  addBox,
  updateBox,
  swapBoxPositions,
  Box,
  boxTypes, // Import boxTypes if needed for tests
} from './boxes';
import { db } from './db'; // Import original db for type info if needed, but we mock it

// Mock the entire db module, defining mocks inside the factory
vi.mock('./db', () => {
  const innerMockGet = vi.fn();
  const innerMockPut = vi.fn();
  const innerMockDelete = vi.fn();
  const innerMockWhere = vi.fn();
  const innerMockFilter = vi.fn();
  const innerMockSortBy = vi.fn();
  const innerMockReverse = vi.fn();
  const innerMockOrderBy = vi.fn();
  const innerMockLast = vi.fn();
  const innerMockEquals = vi.fn();
  const innerMockCollection = {
    filter: innerMockFilter.mockReturnThis(),
    sortBy: innerMockSortBy,
    reverse: innerMockReverse.mockReturnThis(),
    equals: innerMockEquals.mockReturnThis(),
    last: innerMockLast,
  };
  innerMockWhere.mockReturnValue(innerMockCollection);
  innerMockOrderBy.mockReturnValue(innerMockCollection);

  return {
    db: {
      box: { // Mock the 'box' table specifically
        get: innerMockGet,
        put: innerMockPut,
        delete: innerMockDelete,
        where: innerMockWhere,
        orderBy: innerMockOrderBy,
      },
      // Expose inner mocks for test access
      __mocks: {
          mockGet: innerMockGet, mockPut: innerMockPut, mockDelete: innerMockDelete,
          mockWhere: innerMockWhere, mockFilter: innerMockFilter, mockSortBy: innerMockSortBy,
          mockReverse: innerMockReverse, mockOrderBy: innerMockOrderBy, mockLast: innerMockLast,
          mockEquals: innerMockEquals, mockCollection: innerMockCollection
      }
    },
  };
});

// Import the mocked db *after* vi.mock call
const dbMocks = (db as any).__mocks as {
    mockGet: Mock, mockPut: Mock, mockDelete: Mock, mockWhere: Mock, mockFilter: Mock,
    mockSortBy: Mock, mockReverse: Mock, mockOrderBy: Mock, mockLast: Mock, mockEquals: Mock,
    mockCollection: { filter: Mock, sortBy: Mock, reverse: Mock, equals: Mock, last: Mock }
};


describe('Boxes Model', () => {

  beforeEach(() => {
    // ARRANGE: Reset all inner mocks using the dbMocks reference
    dbMocks.mockGet.mockReset();
    dbMocks.mockPut.mockReset();
    dbMocks.mockDelete.mockReset();
    dbMocks.mockWhere.mockReset();
    dbMocks.mockFilter.mockReset();
    dbMocks.mockSortBy.mockReset();
    dbMocks.mockReverse.mockReset();
    dbMocks.mockOrderBy.mockReset();
    dbMocks.mockLast.mockReset();
    dbMocks.mockEquals.mockReset();

    // ARRANGE: Reset chained mocks' return values and default promises
    dbMocks.mockFilter.mockReturnThis();
    dbMocks.mockSortBy.mockResolvedValue([]); // Set default resolved value
    dbMocks.mockReverse.mockReturnThis();
    dbMocks.mockEquals.mockReturnThis();
    dbMocks.mockLast.mockResolvedValue(undefined); // Set default resolved value
    dbMocks.mockWhere.mockReturnValue(dbMocks.mockCollection); // Ensure chain starts correctly
    dbMocks.mockOrderBy.mockReturnValue(dbMocks.mockCollection); // Ensure chain starts correctly


    vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
  });

   afterEach(() => {
      vi.restoreAllMocks(); // Restore console.error
  });

  const box1: Box = { id: 1, hiveId: 10, position: 1, type: boxTypes.DEEP };
  const box2: Box = { id: 2, hiveId: 10, position: 2, type: boxTypes.SUPER };
  const box3: Box = { id: 3, hiveId: 10, position: 0, type: boxTypes.GATE };


  describe('getBox', () => {
    it('should return the box if found', async () => {
      // ARRANGE
      dbMocks.mockGet.mockResolvedValue(box1);
      // ACT
      const result = await getBox(1);
      // ASSERT
      expect(result).toEqual(box1);
      expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
      expect(dbMocks.mockGet).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return null if id is invalid', async () => {
      // ACT
      const result = await getBox(0);
      // ASSERT
      expect(result).toBeNull();
      expect(dbMocks.mockGet).not.toHaveBeenCalled();
    });

    it('should return undefined if box not found (Dexie behavior)', async () => {
        // ARRANGE
        dbMocks.mockGet.mockResolvedValue(undefined);
        // ACT
        const result = await getBox(99);
        // ASSERT
        expect(result).toBeUndefined(); // Dexie get returns undefined
        expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
        expect(dbMocks.mockGet).toHaveBeenCalledWith({ id: 99 });
    });


    it('should log error if db operation fails', async () => {
      // ARRANGE
      const error = new Error('DB Get Error');
      dbMocks.mockGet.mockRejectedValue(error);
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // ACT
      const result = await getBox(1);
      // ASSERT
      expect(result).toBeUndefined();
      expect(dbMocks.mockGet).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(error, { id: 1 });
    });
  });

  describe('getBoxAtPositionAbove', () => {
     it('should query boxes with hiveId, filter position > input, sort by position, and return first', async () => {
        // ARRANGE
        const targetPosition = 1;
        const hiveId = 10;
        dbMocks.mockSortBy.mockResolvedValue([box2]);

        // ACT
        const result = await getBoxAtPositionAbove(hiveId, targetPosition);

        // ASSERT
        expect(result).toEqual(box2);
        expect(dbMocks.mockWhere).toHaveBeenCalledWith('hiveId');
        expect(dbMocks.mockEquals).toHaveBeenCalledWith(hiveId);
        expect(dbMocks.mockFilter).toHaveBeenCalledTimes(1);
        expect(dbMocks.mockSortBy).toHaveBeenCalledWith('position');
    });

     it('should return null if no box found above', async () => {
        // ARRANGE
        const targetPosition = 2;
        const hiveId = 10;
        dbMocks.mockSortBy.mockResolvedValue([]);

        // ACT
        const result = await getBoxAtPositionAbove(hiveId, targetPosition);

        // ASSERT
        expect(result).toBeNull();
        expect(dbMocks.mockWhere).toHaveBeenCalledWith('hiveId');
        expect(dbMocks.mockEquals).toHaveBeenCalledWith(hiveId);
        expect(dbMocks.mockFilter).toHaveBeenCalledTimes(1);
        expect(dbMocks.mockSortBy).toHaveBeenCalledWith('position');
    });

     it('should throw and log error if db operation fails', async () => {
        // ARRANGE
        const error = new Error('DB Where Error');
        dbMocks.mockWhere.mockImplementation(() => { throw error });
        const consoleErrorSpy = vi.spyOn(console, 'error');

        // ACT & ASSERT
        await expect(getBoxAtPositionAbove(10, 1)).rejects.toThrow(error);
        expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('getBoxAtPositionBelow', () => {
     it('should query boxes with hiveId, filter position < input, reverse sort by position, and return first', async () => {
        // ARRANGE
        const targetPosition = 2;
        const hiveId = 10;
        dbMocks.mockSortBy.mockResolvedValue([box1]);

        // ACT
        const result = await getBoxAtPositionBelow(hiveId, targetPosition);

        // ASSERT
        expect(result).toEqual(box1);
        expect(dbMocks.mockWhere).toHaveBeenCalledWith('hiveId');
        expect(dbMocks.mockEquals).toHaveBeenCalledWith(hiveId);
        expect(dbMocks.mockFilter).toHaveBeenCalledTimes(1);
        expect(dbMocks.mockReverse).toHaveBeenCalledTimes(1);
        expect(dbMocks.mockSortBy).toHaveBeenCalledWith('position');
    });

     it('should return null if no box found below', async () => {
        // ARRANGE
        const targetPosition = 0;
        const hiveId = 10;
        dbMocks.mockSortBy.mockResolvedValue([]);

        // ACT
        const result = await getBoxAtPositionBelow(hiveId, targetPosition);

        // ASSERT
        expect(result).toBeNull();
         expect(dbMocks.mockWhere).toHaveBeenCalledWith('hiveId');
        expect(dbMocks.mockEquals).toHaveBeenCalledWith(hiveId);
        expect(dbMocks.mockFilter).toHaveBeenCalledTimes(1);
        expect(dbMocks.mockReverse).toHaveBeenCalledTimes(1);
        expect(dbMocks.mockSortBy).toHaveBeenCalledWith('position');
    });

     it('should throw and log error if db operation fails', async () => {
        // ARRANGE
        const error = new Error('DB Filter Error');
        dbMocks.mockFilter.mockImplementation(() => { throw error });
        const consoleErrorSpy = vi.spyOn(console, 'error');

        // ACT & ASSERT
        await expect(getBoxAtPositionBelow(10, 1)).rejects.toThrow(error);
        expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('getBoxes', () => {
    it('should query boxes with where clause, reverse sort by position', async () => {
        // ARRANGE
        const whereClause = { hiveId: 10 };
        dbMocks.mockSortBy.mockResolvedValue([box2, box1, box3]);

        // ACT
        const result = await getBoxes(whereClause);

        // ASSERT
        expect(result).toEqual([box2, box1, box3]);
        expect(dbMocks.mockWhere).toHaveBeenCalledWith(whereClause);
        expect(dbMocks.mockReverse).toHaveBeenCalledTimes(1);
        expect(dbMocks.mockSortBy).toHaveBeenCalledWith('position');
    });

     it('should handle empty where clause', async () => {
        // ARRANGE
        dbMocks.mockSortBy.mockResolvedValue([box2, box1, box3]);

        // ACT
        const result = await getBoxes({});

        // ASSERT
        expect(result).toEqual([box2, box1, box3]);
        expect(dbMocks.mockWhere).toHaveBeenCalledWith({});
        expect(dbMocks.mockReverse).toHaveBeenCalledTimes(1);
        expect(dbMocks.mockSortBy).toHaveBeenCalledWith('position');
    });

     it('should return empty array if no boxes match', async () => {
        // ARRANGE
        const whereClause = { hiveId: 99 };
        dbMocks.mockSortBy.mockResolvedValue([]);

        // ACT
        const result = await getBoxes(whereClause);

        // ASSERT
        expect(result).toEqual([]);
        expect(dbMocks.mockWhere).toHaveBeenCalledWith(whereClause);
        expect(dbMocks.mockReverse).toHaveBeenCalledTimes(1);
        expect(dbMocks.mockSortBy).toHaveBeenCalledWith('position');
    });

     it('should throw and log error if db operation fails', async () => {
        // ARRANGE
        const error = new Error('DB SortBy Error');
        dbMocks.mockSortBy.mockRejectedValue(error);
        const consoleErrorSpy = vi.spyOn(console, 'error');

        // ACT & ASSERT
        await expect(getBoxes({ hiveId: 10 })).rejects.toThrow(error);
        expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('maxBoxPosition', () => {
    it('should return the position of the last box ordered by position', async () => {
        // ARRANGE
        dbMocks.mockLast.mockResolvedValue(box2);
        // ACT
        const result = await maxBoxPosition(10);
        // ASSERT
        expect(result).toBe(2);
        expect(dbMocks.mockOrderBy).toHaveBeenCalledWith('position');
        expect(dbMocks.mockLast).toHaveBeenCalledTimes(1);
    });

     it('should return 0 if no boxes exist', async () => {
        // ARRANGE
        dbMocks.mockLast.mockResolvedValue(undefined);
        // ACT
        const result = await maxBoxPosition(10);
        // ASSERT
        expect(result).toBe(0);
        expect(dbMocks.mockOrderBy).toHaveBeenCalledWith('position');
        expect(dbMocks.mockLast).toHaveBeenCalledTimes(1);
    });

     it('should throw and log error if db operation fails', async () => {
        // ARRANGE
        const error = new Error('DB OrderBy Error');
        dbMocks.mockOrderBy.mockImplementation(() => { throw error });
        const consoleErrorSpy = vi.spyOn(console, 'error');

        // ACT & ASSERT
        await expect(maxBoxPosition(10)).rejects.toThrow(error);
        expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('removeBox', () => {
    it('should call db.delete with the id', async () => {
        // ARRANGE
        const boxId = 1;
        dbMocks.mockDelete.mockResolvedValue(undefined);

        // ACT
        await removeBox(boxId);

        // ASSERT
        expect(dbMocks.mockDelete).toHaveBeenCalledTimes(1);
        expect(dbMocks.mockDelete).toHaveBeenCalledWith(boxId);
    });

     it('should throw and log error if db.delete fails', async () => {
        // ARRANGE
        const boxId = 1;
        const error = new Error('DB Delete Error');
        dbMocks.mockDelete.mockRejectedValue(error);
        const consoleErrorSpy = vi.spyOn(console, 'error');

        // ACT & ASSERT
        await expect(removeBox(boxId)).rejects.toThrow(error);
        expect(dbMocks.mockDelete).toHaveBeenCalledTimes(1);
        expect(dbMocks.mockDelete).toHaveBeenCalledWith(boxId);
        expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('addBox', () => {
    it('should call db.put with provided box data (id, hiveId, position, type)', async () => {
        // ARRANGE
        const newBox: Box = { id: 4, hiveId: 11, position: 0, type: boxTypes.DEEP };
        dbMocks.mockPut.mockResolvedValue(4);

        // ACT
        await addBox(newBox);

        // ASSERT
        expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
        expect(dbMocks.mockPut).toHaveBeenCalledWith({
            id: newBox.id,
            hiveId: newBox.hiveId,
            position: newBox.position,
            type: newBox.type,
        });
    });

     it('should throw and log error if db.put fails', async () => {
        // ARRANGE
        const newBox: Box = { id: 5, hiveId: 12, position: 1, type: boxTypes.SUPER };
        const error = new Error('DB Put Error Add');
        dbMocks.mockPut.mockRejectedValue(error);
        const consoleErrorSpy = vi.spyOn(console, 'error');

        // ACT & ASSERT
        await expect(addBox(newBox)).rejects.toThrow(error);
        expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('updateBox', () => {
     it('should call db.put with provided box data (id, hiveId, color, position, type)', async () => {
        // ARRANGE
        const updatedBox: Box = { id: 1, hiveId: 10, position: 1, type: boxTypes.DEEP, color: 'blue' };
        dbMocks.mockPut.mockResolvedValue(1);

        // ACT
        await updateBox(updatedBox);

        // ASSERT
        expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
        expect(dbMocks.mockPut).toHaveBeenCalledWith({
            id: updatedBox.id,
            hiveId: updatedBox.hiveId,
            color: updatedBox.color,
            position: updatedBox.position,
            type: updatedBox.type,
        });
    });

     it('should call db.put correctly if optional fields are missing', async () => {
        // ARRANGE
        const updatedBox: Box = { id: 2, hiveId: 10, position: 2, type: boxTypes.SUPER }; // color missing
        dbMocks.mockPut.mockResolvedValue(2);

        // ACT
        await updateBox(updatedBox);

        // ASSERT
        expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
        expect(dbMocks.mockPut).toHaveBeenCalledWith({
            id: updatedBox.id,
            hiveId: updatedBox.hiveId,
            color: undefined, // Should be undefined
            position: updatedBox.position,
            type: updatedBox.type,
        });
    });

     it('should throw and log error if db.put fails', async () => {
        // ARRANGE
        const updatedBox: Box = { id: 3, hiveId: 10, position: 0, type: boxTypes.GATE };
        const error = new Error('DB Put Error Update');
        dbMocks.mockPut.mockRejectedValue(error);
        const consoleErrorSpy = vi.spyOn(console, 'error');

        // ACT & ASSERT
        await expect(updateBox(updatedBox)).rejects.toThrow(error);
        expect(dbMocks.mockPut).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  describe('swapBoxPositions', () => {
    it('should swap positions and call db.put for both boxes', async () => {
        // ARRANGE
        const boxA: Box = { id: 1, hiveId: 10, position: 1, type: 'DEEP' };
        const boxB: Box = { id: 2, hiveId: 10, position: 2, type: 'SUPER' };
        const boxACopy = { ...boxA };
        const boxBCopy = { ...boxB };
        dbMocks.mockPut.mockResolvedValue(undefined);

        // ACT
        const result = await swapBoxPositions(boxACopy, boxBCopy);

        // ASSERT
        expect(result).toBe(true);
        expect(dbMocks.mockPut).toHaveBeenCalledTimes(2);
        expect(boxACopy.position).toBe(2);
        expect(boxBCopy.position).toBe(1);
        expect(dbMocks.mockPut).toHaveBeenCalledWith(boxACopy);
        expect(dbMocks.mockPut).toHaveBeenCalledWith(boxBCopy);
    });

     it('should handle non-numeric positions correctly during swap', async () => {
        // ARRANGE
        const boxA: Box = { id: 1, hiveId: 10, position: '1' as any, type: 'DEEP' };
        const boxB: Box = { id: 2, hiveId: 10, position: 2, type: 'SUPER' };
        const boxACopy = { ...boxA };
        const boxBCopy = { ...boxB };
        dbMocks.mockPut.mockResolvedValue(undefined);

        // ACT
        await swapBoxPositions(boxACopy, boxBCopy);

        // ASSERT
        expect(boxACopy.position).toBe(2);
        expect(boxBCopy.position).toBe(1);
        expect(dbMocks.mockPut).toHaveBeenCalledTimes(2);
        expect(dbMocks.mockPut).toHaveBeenCalledWith(boxACopy);
        expect(dbMocks.mockPut).toHaveBeenCalledWith(boxBCopy);
    });
  });

});
