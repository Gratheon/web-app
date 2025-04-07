import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { writeHooks } from './writeHooks';

// --- Mock Dependencies ---

// Mock functions from './index.ts' - Define inside factory
vi.mock('./index.ts', () => ({
  upsertEntity: vi.fn(),
  upsertEntityWithNumericID: vi.fn(),
}));

// Mock functions from '../frames.ts' - Define inside factory
vi.mock('../frames.ts', async (importOriginal) => {
  const original = await importOriginal() as any;
  return {
    ...original,
    upsertFrame: vi.fn(),
  };
});

// Mock functions from '../frameSide.ts' - Define inside factory
vi.mock('../frameSide.ts', async (importOriginal) => {
    const original = await importOriginal() as any;
    return {
      ...original,
      upsertFrameSide: vi.fn(),
    };
});

// Mock functions from '../fileResize.ts' - Define inside factory
vi.mock('../fileResize.ts', async (importOriginal) => {
    const original = await importOriginal() as any;
    return {
      ...original,
      upsertFileResize: vi.fn(),
    };
});

// Mock functions from '../frameSideFile.ts' - Define inside factory
vi.mock('../frameSideFile.ts', async (importOriginal) => {
    const original = await importOriginal() as any;
    return {
      ...original,
      default: {
         ...(original.default || {}),
         upsertEntity: vi.fn()
      }
    };
});

// Import mocks *after* vi.mock calls
import { upsertEntity, upsertEntityWithNumericID } from './index.ts';
import { upsertFrame } from '../frames.ts';
import { upsertFrameSide } from '../frameSide.ts';
import { upsertFileResize } from '../fileResize.ts';
import frameSideFileModel from '../frameSideFile.ts';

// Cast mocks for type safety in tests
const mockUpsertEntity = upsertEntity as Mock;
const mockUpsertEntityWithNumericID = upsertEntityWithNumericID as Mock;
const mockUpsertFrame = upsertFrame as Mock;
const mockUpsertFrameSide = upsertFrameSide as Mock;
const mockUpsertFileResize = upsertFileResize as Mock;
const mockFrameSideFileUpsert = frameSideFileModel.upsertEntity as Mock;


describe('writeHooks', () => {

  beforeEach(() => {
    // ARRANGE: Reset mocks before each test
    mockUpsertEntity.mockReset();
    mockUpsertEntityWithNumericID.mockReset();
    mockUpsertFrame.mockReset();
    mockUpsertFrameSide.mockReset();
    mockUpsertFileResize.mockReset();
    mockFrameSideFileUpsert.mockReset();
  });

  describe('Apiary', () => {
    it('should call upsertEntityWithNumericID with "apiary" and the entity', async () => {
      // ARRANGE
      const mockEntity = { id: '1', name: 'Test Apiary' };

      // ACT
      await (writeHooks.Apiary as any)(null, mockEntity, {} as any);

      // ASSERT
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('apiary', mockEntity);
    });

    it('should propagate errors from upsertEntityWithNumericID', async () => {
       // ARRANGE
       const mockEntity = { id: '1', name: 'Test Apiary' };
       const error = new Error('DB Error');
       mockUpsertEntityWithNumericID.mockRejectedValue(error);

        // ACT & ASSERT
       await expect((writeHooks.Apiary as any)(null, mockEntity, {} as any)).rejects.toThrow(error);
       expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hive', () => {
    it('should call upsertEntityWithNumericID with "hive" and the entity', async () => {
      // ARRANGE
      const mockEntity = { id: '10', name: 'Test Hive' };

      // ACT
      await (writeHooks.Hive as any)(null, mockEntity, {} as any);

      // ASSERT
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('hive', mockEntity);
    });

     it('should propagate errors from upsertEntityWithNumericID', async () => {
       // ARRANGE
       const mockEntity = { id: '10', name: 'Test Hive' };
       const error = new Error('DB Error Hive');
       mockUpsertEntityWithNumericID.mockRejectedValue(error);

        // ACT & ASSERT
       await expect((writeHooks.Hive as any)(null, mockEntity, {} as any)).rejects.toThrow(error);
       expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
  });

  describe('Box', () => {
    it('should add numeric hiveId from parent and call upsertEntityWithNumericID', async () => {
      // ARRANGE
      const mockParent = { id: '5' }; // Parent is Hive
      const mockEntity = { id: '20', type: 'Deep' };
      const expectedEntity = { ...mockEntity, hiveId: 5 };

      // ACT
      await (writeHooks.Box as any)(mockParent, mockEntity, {} as any);

      // ASSERT
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('box', expectedEntity);
    });

     it('should propagate errors from upsertEntityWithNumericID', async () => {
       // ARRANGE
       const mockParent = { id: '5' };
       const mockEntity = { id: '20', type: 'Deep' };
       const error = new Error('DB Error Box');
       mockUpsertEntityWithNumericID.mockRejectedValue(error);

        // ACT & ASSERT
       await expect((writeHooks.Box as any)(mockParent, mockEntity, {} as any)).rejects.toThrow(error);
       expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });

     it('should handle non-numeric parent ID gracefully (though upsert might fail later)', async () => {
        // ARRANGE
        const mockParent = { id: 'abc' }; // Non-numeric parent ID
        const mockEntity = { id: '21', type: 'Medium' };
        const expectedEntity = { ...mockEntity, hiveId: NaN }; // + 'abc' results in NaN

        // ACT
        await (writeHooks.Box as any)(mockParent, mockEntity, {} as any);

        // ASSERT
        expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
        expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('box', expectedEntity);
    });
  });

   describe('Family', () => {
    it('should add numeric hiveId from parent and call upsertEntityWithNumericID', async () => {
      // ARRANGE
      const mockParent = { id: '7' }; // Parent is Hive
      const mockEntity = { id: '30', queen_status: 'present' };
      const expectedEntity = { ...mockEntity, hiveId: 7 };

      // ACT
      await (writeHooks.Family as any)(mockParent, mockEntity, {} as any);

      // ASSERT
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('family', expectedEntity);
    });

     it('should propagate errors from upsertEntityWithNumericID', async () => {
       // ARRANGE
       const mockParent = { id: '7' };
       const mockEntity = { id: '30', queen_status: 'present' };
       const error = new Error('DB Error Family');
       mockUpsertEntityWithNumericID.mockRejectedValue(error);

        // ACT & ASSERT
       await expect((writeHooks.Family as any)(mockParent, mockEntity, {} as any)).rejects.toThrow(error);
       expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
  });

  describe('Frame', () => {
    it('should add numeric boxId, leftId, rightId and call upsertFrame', async () => {
        // ARRANGE
        const mockParent = { id: '15' }; // Parent is Box
        const mockValue: any = { id: '100', label: 'F1', position: 1, type: 'DEEP', leftId: null, rightId: null }; // Use any for test simplicity
        const mockOriginalValue = {
            id: '100',
            label: 'F1',
            position: 1,
            type: 'DEEP',
            leftSide: { id: '200' },
            rightSide: { id: '201' }
        };
        const expectedValue = {
            id: '100',
            label: 'F1',
            position: 1,
            type: 'DEEP',
            boxId: 15,
            leftId: 200,
            rightId: 201
        };

        // ACT
        await (writeHooks.Frame as any)(mockParent, mockValue, { originalValue: mockOriginalValue });

        // ASSERT
        expect(mockUpsertFrame).toHaveBeenCalledTimes(1);
        expect(mockUpsertFrame).toHaveBeenCalledWith(expectedValue);
    });

     it('should handle missing parent (boxId)', async () => {
        // ARRANGE
        const mockValue: any = { id: '101', label: 'F2', position: 2, type: 'MEDIUM', leftId: null, rightId: null };
        const mockOriginalValue = { id: '101', label: 'F2', position: 2, type: 'MEDIUM', leftSide: { id: '202' }, rightSide: null };
         const expectedValue = {
            id: '101',
            label: 'F2',
            position: 2,
            type: 'MEDIUM',
            boxId: undefined,
            leftId: 202,
            rightId: null // Changed from undefined
        };

        // ACT
        await (writeHooks.Frame as any)(null, mockValue, { originalValue: mockOriginalValue });

        // ASSERT
        expect(mockUpsertFrame).toHaveBeenCalledTimes(1);
        expect(mockUpsertFrame).toHaveBeenCalledWith(expectedValue);
    });

     it('should handle missing left/right sides', async () => {
        // ARRANGE
        const mockParent = { id: '16' };
        const mockValue: any = { id: '102', label: 'F3', position: 3, type: 'SHALLOW', leftId: null, rightId: null };
        const mockOriginalValue = { id: '102', label: 'F3', position: 3, type: 'SHALLOW', leftSide: null, rightSide: null };
         const expectedValue = {
            id: '102',
            label: 'F3',
            position: 3,
            type: 'SHALLOW',
            boxId: 16,
            leftId: null, // Changed from undefined
            rightId: null // Changed from undefined
        };

        // ACT
        await (writeHooks.Frame as any)(mockParent, mockValue, { originalValue: mockOriginalValue });

        // ASSERT
        expect(mockUpsertFrame).toHaveBeenCalledTimes(1);
        expect(mockUpsertFrame).toHaveBeenCalledWith(expectedValue);
    });

     it('should propagate errors from upsertFrame', async () => {
        // ARRANGE
        const mockParent = { id: '15' };
        const mockValue: any = { id: '100', label: 'F1', position: 1, type: 'DEEP', leftId: null, rightId: null };
        const mockOriginalValue = { id: '100', label: 'F1', position: 1, type: 'DEEP', leftSide: { id: '200' }, rightSide: { id: '201' } };
        const error = new Error('DB Error Frame');
        mockUpsertFrame.mockRejectedValue(error);

        // ACT & ASSERT
        await expect((writeHooks.Frame as any)(mockParent, mockValue, { originalValue: mockOriginalValue })).rejects.toThrow(error);
        expect(mockUpsertFrame).toHaveBeenCalledTimes(1);
    });
  });

  describe('FrameSide', () => {
    it('should convert id to number if present and call upsertFrameSide', async () => {
        // ARRANGE
        const mockFrameSide = { id: '300', side: 'left', frameId: '100' };
        const expectedFrameSide = { id: 300, side: 'left', frameId: '100' };

        // ACT
        await (writeHooks.FrameSide as any)(null, mockFrameSide, {} as any);

        // ASSERT
        expect(mockUpsertFrameSide).toHaveBeenCalledTimes(1);
        expect(mockUpsertFrameSide).toHaveBeenCalledWith(expectedFrameSide);
    });

     it('should call upsertFrameSide even if id is null/undefined', async () => {
        // ARRANGE
        const mockFrameSide = { id: null, side: 'right', frameId: '101' };
        const expectedFrameSide = { id: null, side: 'right', frameId: '101' };

        // ACT
        await (writeHooks.FrameSide as any)(null, mockFrameSide, {} as any);

        // ASSERT
        expect(mockUpsertFrameSide).toHaveBeenCalledTimes(1);
        expect(mockUpsertFrameSide).toHaveBeenCalledWith(expectedFrameSide);
    });

     it('should propagate errors from upsertFrameSide', async () => {
        // ARRANGE
        const mockFrameSide = { id: '301', side: 'left', frameId: '102' };
        const error = new Error('DB Error FrameSide');
        mockUpsertFrameSide.mockRejectedValue(error);

        // ACT & ASSERT
        await expect((writeHooks.FrameSide as any)(null, mockFrameSide, {} as any)).rejects.toThrow(error);
        expect(mockUpsertFrameSide).toHaveBeenCalledTimes(1);
    });
  });

  describe('FileResize', () => {
    it('should add numeric file_id from parent and call upsertFileResize', async () => {
        // ARRANGE
        const mockParent = { id: '500' }; // Parent is File
        const mockEntity = { id: '600', width: 100, height: 80, url: 'url1' };
        const expectedEntity = { ...mockEntity, file_id: 500 };

        // ACT
        await (writeHooks.FileResize as any)(mockParent, mockEntity, {} as any);

        // ASSERT
        expect(mockUpsertFileResize).toHaveBeenCalledTimes(1);
        expect(mockUpsertFileResize).toHaveBeenCalledWith(expectedEntity);
    });

     it('should propagate errors from upsertFileResize', async () => {
        // ARRANGE
        const mockParent = { id: '501' };
        const mockEntity = { id: '601', width: 200, height: 160, url: 'url2' };
        const error = new Error('DB Error FileResize');
        mockUpsertFileResize.mockRejectedValue(error);

        // ACT & ASSERT
        await expect((writeHooks.FileResize as any)(mockParent, mockEntity, {} as any)).rejects.toThrow(error);
        expect(mockUpsertFileResize).toHaveBeenCalledTimes(1);
    });
  });

  describe('FrameSideInspection', () => {
    it('should create composite id, convert foreign keys to numbers, and call upsertEntity', async () => {
        // ARRANGE
        const mockEntity = { inspectionId: '1000', frameSideId: '300', notes: 'test' };
        const expectedEntity = {
            inspectionId: 1000,
            frameSideId: 300,
            notes: 'test',
            id: '1000_300' // Composite ID
        };

        // ACT
        await (writeHooks.FrameSideInspection as any)(null, mockEntity, {} as any);

        // ASSERT
        expect(mockUpsertEntity).toHaveBeenCalledTimes(1);
        expect(mockUpsertEntity).toHaveBeenCalledWith('frame_side_inspection', expectedEntity);
    });

     it('should propagate errors from upsertEntity', async () => {
        // ARRANGE
        const mockEntity = { inspectionId: '1001', frameSideId: '301', notes: 'fail' };
        const error = new Error('DB Error FrameSideInspection');
        mockUpsertEntity.mockRejectedValue(error);

        // ACT & ASSERT
        await expect((writeHooks.FrameSideInspection as any)(null, mockEntity, {} as any)).rejects.toThrow(error);
        expect(mockUpsertEntity).toHaveBeenCalledTimes(1);
    });
  });

  describe('FrameSideFile', () => {
    it('should call frameSideFileModel.upsertEntity with entity and originalValue', async () => {
        // ARRANGE
        const mockParent = { id: '305' }; // Parent is FrameSide
        const mockEntity: any = { // Use any for test simplicity
             id: '700',
             file_id: '505',
             is_primary: true
        };
        const mockOriginalValue = { id: '700', file: { id: '505' }, is_primary: true };

        // ACT
        await writeHooks.FrameSideFile(mockParent, mockEntity, { originalValue: mockOriginalValue });

        // ASSERT
        expect(mockFrameSideFileUpsert).toHaveBeenCalledTimes(1);
        expect(mockFrameSideFileUpsert).toHaveBeenCalledWith(mockEntity, mockOriginalValue);
    });

     it('should propagate errors from frameSideFileModel.upsertEntity', async () => {
        // ARRANGE
        const mockParent = { id: '306' };
        const mockEntity: any = {
            id: '701',
            file_id: '506',
            is_primary: false
        };
        const mockOriginalValue = { id: '701', file: { id: '506' }, is_primary: false };
        const error = new Error('DB Error FrameSideFile');
        mockFrameSideFileUpsert.mockRejectedValue(error);

        // ACT & ASSERT
        await expect(writeHooks.FrameSideFile(mockParent, mockEntity, { originalValue: mockOriginalValue })).rejects.toThrow(error);
        expect(mockFrameSideFileUpsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('FrameSideCells', () => {
    it('should convert percentages and id to numbers and call upsertEntityWithNumericID', async () => {
        // ARRANGE
        const mockCells: any = { // Use any for test simplicity
            id: '310',
            broodPercent: '10.5',
            cappedBroodPercent: '5',
            eggsPercent: '2.2',
            pollenPercent: '3',
            honeyPercent: '20'
        };
        const expectedEntity = {
            id: 310,
            frameSideId: 310,
            broodPercent: 10.5,
            cappedBroodPercent: 5,
            eggsPercent: 2.2,
            pollenPercent: 3,
            honeyPercent: 20,
        };

        // ACT
        await writeHooks.FrameSideCells(null, mockCells, {} as any);

        // ASSERT
        expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
        expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('files_frame_side_cells', expectedEntity);
    });

     it('should handle missing percentage fields by defaulting to 0', async () => {
        // ARRANGE
        const mockCells: any = {
            id: '311',
            broodPercent: '15',
            pollenPercent: null,
            honeyPercent: undefined,
        };
         const expectedEntity = {
            id: 311,
            frameSideId: 311,
            broodPercent: 15,
            cappedBroodPercent: 0,
            eggsPercent: 0,
            pollenPercent: 0,
            honeyPercent: 0,
        };

        // ACT
        await writeHooks.FrameSideCells(null, mockCells, {} as any);

        // ASSERT
        expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
        expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('files_frame_side_cells', expectedEntity);
    });

     it('should return early if cells object is empty', async () => {
        // ARRANGE
        const mockCells = {};
        // ACT
        await writeHooks.FrameSideCells(null, mockCells as any, {} as any);
        // ASSERT
        expect(mockUpsertEntityWithNumericID).not.toHaveBeenCalled();
    });

     it('should propagate errors from upsertEntityWithNumericID', async () => {
        // ARRANGE
        const mockCells: any = { id: '312', broodPercent: '5' };
        const error = new Error('DB Error FrameSideCells');
        mockUpsertEntityWithNumericID.mockRejectedValue(error);

        // ACT & ASSERT
        await expect(writeHooks.FrameSideCells(null, mockCells, {} as any)).rejects.toThrow(error);
        expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
  });

  describe('File', () => {
    it('should call upsertEntityWithNumericID with "file" and the entity', async () => {
      // ARRANGE
      const mockEntity = { id: '510', name: 'image.jpg', url: 'url3' };
      // ACT
      await (writeHooks.File as any)(null, mockEntity, {} as any);
      // ASSERT
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('file', mockEntity);
    });

     it('should propagate errors from upsertEntityWithNumericID', async () => {
       // ARRANGE
       const mockEntity = { id: '511', name: 'image2.jpg', url: 'url4' };
       const error = new Error('DB Error File');
       mockUpsertEntityWithNumericID.mockRejectedValue(error);

        // ACT & ASSERT
       await expect((writeHooks.File as any)(null, mockEntity, {} as any)).rejects.toThrow(error);
       expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
  });

  describe('Inspection', () => {
    it('should convert hiveId to number and call upsertEntityWithNumericID', async () => {
      // ARRANGE
      const mockEntity = { id: '1010', hiveId: '8', date: '2024-01-01' };
      const expectedEntity = { ...mockEntity, hiveId: 8 };

      // ACT
      await (writeHooks.Inspection as any)(null, mockEntity, {} as any);

      // ASSERT
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('inspection', expectedEntity);
    });

     it('should propagate errors from upsertEntityWithNumericID', async () => {
       // ARRANGE
       const mockEntity = { id: '1011', hiveId: '9', date: '2024-01-02' };
       const error = new Error('DB Error Inspection');
       mockUpsertEntityWithNumericID.mockRejectedValue(error);

        // ACT & ASSERT
       await expect((writeHooks.Inspection as any)(null, mockEntity, {} as any)).rejects.toThrow(error);
       expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
  });

  describe('User', () => {
    it('should call upsertEntityWithNumericID with "user" and the entity', async () => {
      // ARRANGE
      const mockEntity = { id: '1', email: 'test@example.com' };
      // ACT
      await (writeHooks.User as any)(null, mockEntity, {} as any);
      // ASSERT
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('user', mockEntity);
    });

     it('should propagate errors from upsertEntityWithNumericID', async () => {
       // ARRANGE
       const mockEntity = { id: '2', email: 'test2@example.com' };
       const error = new Error('DB Error User');
       mockUpsertEntityWithNumericID.mockRejectedValue(error);

        // ACT & ASSERT
       await expect((writeHooks.User as any)(null, mockEntity, {} as any)).rejects.toThrow(error);
       expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
  });

  describe('Locale', () => {
    it('should call upsertEntityWithNumericID with "locale" and the entity', async () => {
      // ARRANGE
      const mockEntity = { id: '1', code: 'en', name: 'English' };
      // ACT
      await (writeHooks.Locale as any)(null, mockEntity, {} as any);
      // ASSERT
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('locale', mockEntity);
    });

     it('should propagate errors from upsertEntityWithNumericID', async () => {
       // ARRANGE
       const mockEntity = { id: '2', code: 'es', name: 'Spanish' };
       const error = new Error('DB Error Locale');
       mockUpsertEntityWithNumericID.mockRejectedValue(error);

        // ACT & ASSERT
       await expect((writeHooks.Locale as any)(null, mockEntity, {} as any)).rejects.toThrow(error);
       expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
  });

});
