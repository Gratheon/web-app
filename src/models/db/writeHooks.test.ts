import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { writeHooks } from './writeHooks';
import { FRAME_SIDE_INSPECTION_TABLE } from '../frameSideInspection'; // Import table name

// --- Mock Dependencies ---

// Mock only the necessary functions from './index.ts'
// Avoid mocking 'db' here to prevent hoisting issues related to its internal mocks
vi.mock('./index.ts', () => ({
  upsertEntity: vi.fn(),
  upsertEntityWithNumericID: vi.fn(),
  // NOTE: 'db' is intentionally NOT mocked here in this file's context
  // The actual 'db' object will be used by functions imported from other modules,
  // but those modules should be mocked where necessary (like frameSideInspection below).
}));

// Mock other dependencies as before
vi.mock('../frames.ts', async (importOriginal) => {
  const original = await importOriginal() as any;
  return { ...original, upsertFrame: vi.fn() };
});
vi.mock('../frameSide.ts', async (importOriginal) => {
  const original = await importOriginal() as any;
  return { ...original, upsertFrameSide: vi.fn() };
});
vi.mock('../fileResize.ts', async (importOriginal) => {
  const original = await importOriginal() as any;
  return { ...original, upsertFileResize: vi.fn() };
});
vi.mock('../frameSideFile.ts', async (importOriginal) => {
  const original = await importOriginal() as any;
  return { ...original, default: { ...(original.default || {}), upsertEntity: vi.fn() } };
});
// Mock the model function used by the FrameSideInspection hook
vi.mock('../frameSideInspection', () => ({
    upsertFrameSideInspection: vi.fn(),
}));


// Import mocks *after* vi.mock calls
import { upsertEntity, upsertEntityWithNumericID } from './index.ts'; // Import the mocked functions
import { upsertFrame } from '../frames.ts';
import { upsertFrameSide } from '../frameSide.ts';
import { upsertFileResize } from '../fileResize.ts';
import frameSideFileModel from '../frameSideFile.ts';
import { upsertFrameSideInspection } from '../frameSideInspection'; // Import the mocked function

// Cast mocks for type safety in tests
const mockUpsertEntity = upsertEntity as Mock;
const mockUpsertEntityWithNumericID = upsertEntityWithNumericID as Mock;
const mockUpsertFrame = upsertFrame as Mock;
const mockUpsertFrameSide = upsertFrameSide as Mock;
const mockUpsertFileResize = upsertFileResize as Mock;
const mockFrameSideFileUpsert = frameSideFileModel.upsertEntity as Mock;
const mockUpsertFrameSideInspection = upsertFrameSideInspection as Mock;


describe('writeHooks', () => {

  beforeEach(() => {
    // ARRANGE: Reset mocks before each test
    mockUpsertEntity.mockReset();
    mockUpsertEntityWithNumericID.mockReset();
    mockUpsertFrame.mockReset();
    mockUpsertFrameSide.mockReset();
    mockUpsertFileResize.mockReset();
    mockFrameSideFileUpsert.mockReset();
    mockUpsertFrameSideInspection.mockReset();
  });

  // --- Tests for hooks NOT using the new model ---
  describe('Apiary', () => {
    it('should call upsertEntityWithNumericID with "apiary" and the entity', async () => {
      const mockEntity = { id: '1', name: 'Test Apiary' };
      await (writeHooks.Apiary as any)(null, mockEntity, {} as any);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('apiary', mockEntity);
    });
    it('should propagate errors from upsertEntityWithNumericID', async () => {
       const mockEntity = { id: '1', name: 'Test Apiary' };
       const error = new Error('DB Error');
       mockUpsertEntityWithNumericID.mockRejectedValue(error);
       await expect((writeHooks.Apiary as any)(null, mockEntity, {} as any)).rejects.toThrow(error);
       expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hive', () => {
    it('should call upsertEntityWithNumericID with "hive" and the entity', async () => {
      const mockEntity = { id: '10', name: 'Test Hive' };
      await (writeHooks.Hive as any)(null, mockEntity, {} as any);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('hive', mockEntity);
    });
     it('should propagate errors from upsertEntityWithNumericID', async () => {
       const mockEntity = { id: '10', name: 'Test Hive' };
       const error = new Error('DB Error Hive');
       mockUpsertEntityWithNumericID.mockRejectedValue(error);
       await expect((writeHooks.Hive as any)(null, mockEntity, {} as any)).rejects.toThrow(error);
       expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
  });

  describe('Box', () => {
    it('should add numeric hiveId from parent and call upsertEntityWithNumericID', async () => {
      const mockParent = { id: '5' };
      const mockEntity = { id: '20', type: 'Deep' };
      const expectedEntity = { ...mockEntity, hiveId: 5 };
      await (writeHooks.Box as any)(mockParent, mockEntity, {} as any);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('box', expectedEntity);
    });
     it('should propagate errors from upsertEntityWithNumericID', async () => {
       const mockParent = { id: '5' };
       const mockEntity = { id: '20', type: 'Deep' };
       const error = new Error('DB Error Box');
       mockUpsertEntityWithNumericID.mockRejectedValue(error);
       await expect((writeHooks.Box as any)(mockParent, mockEntity, {} as any)).rejects.toThrow(error);
       expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
     it('should handle non-numeric parent ID gracefully', async () => {
        const mockParent = { id: 'abc' };
        const mockEntity = { id: '21', type: 'Medium' };
        const expectedEntity = { ...mockEntity, hiveId: NaN };
        await (writeHooks.Box as any)(mockParent, mockEntity, {} as any);
        expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
        expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('box', expectedEntity);
    });
  });

   describe('Family', () => {
    it('should add numeric hiveId from parent and call upsertEntityWithNumericID', async () => {
      const mockParent = { id: '7' };
      const mockEntity = { id: '30', queen_status: 'present' };
      const expectedEntity = { ...mockEntity, hiveId: 7 };
      await (writeHooks.Family as any)(mockParent, mockEntity, {} as any);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('family', expectedEntity);
    });
     it('should propagate errors from upsertEntityWithNumericID', async () => {
       const mockParent = { id: '7' };
       const mockEntity = { id: '30', queen_status: 'present' };
       const error = new Error('DB Error Family');
       mockUpsertEntityWithNumericID.mockRejectedValue(error);
       await expect((writeHooks.Family as any)(mockParent, mockEntity, {} as any)).rejects.toThrow(error);
       expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
  });

  describe('Frame', () => {
    it('should add numeric boxId, leftId, rightId and call upsertFrame', async () => {
        const mockParent = { id: '15' };
        const mockValue: any = { id: '100', label: 'F1', position: 1, type: 'DEEP', leftId: null, rightId: null };
        const mockOriginalValue = { id: '100', label: 'F1', position: 1, type: 'DEEP', leftSide: { id: '200' }, rightSide: { id: '201' } };
        const expectedValue = { id: '100', label: 'F1', position: 1, type: 'DEEP', boxId: 15, leftId: 200, rightId: 201 };
        await (writeHooks.Frame as any)(mockParent, mockValue, { originalValue: mockOriginalValue });
        expect(mockUpsertFrame).toHaveBeenCalledTimes(1);
        expect(mockUpsertFrame).toHaveBeenCalledWith(expectedValue);
    });
     it('should handle missing parent (boxId)', async () => {
        const mockValue: any = { id: '101', label: 'F2', position: 2, type: 'MEDIUM', leftId: null, rightId: null };
        const mockOriginalValue = { id: '101', label: 'F2', position: 2, type: 'MEDIUM', leftSide: { id: '202' }, rightSide: null };
         const expectedValue = { id: '101', label: 'F2', position: 2, type: 'MEDIUM', boxId: undefined, leftId: 202, rightId: null };
        await (writeHooks.Frame as any)(null, mockValue, { originalValue: mockOriginalValue });
        expect(mockUpsertFrame).toHaveBeenCalledTimes(1);
        expect(mockUpsertFrame).toHaveBeenCalledWith(expectedValue);
    });
     it('should handle missing left/right sides', async () => {
        const mockParent = { id: '16' };
        const mockValue: any = { id: '102', label: 'F3', position: 3, type: 'SHALLOW', leftId: null, rightId: null };
        const mockOriginalValue = { id: '102', label: 'F3', position: 3, type: 'SHALLOW', leftSide: null, rightSide: null };
         const expectedValue = { id: '102', label: 'F3', position: 3, type: 'SHALLOW', boxId: 16, leftId: null, rightId: null };
        await (writeHooks.Frame as any)(mockParent, mockValue, { originalValue: mockOriginalValue });
        expect(mockUpsertFrame).toHaveBeenCalledTimes(1);
        expect(mockUpsertFrame).toHaveBeenCalledWith(expectedValue);
    });
     it('should propagate errors from upsertFrame', async () => {
        const mockParent = { id: '15' };
        const mockValue: any = { id: '100', label: 'F1', position: 1, type: 'DEEP', leftId: null, rightId: null };
        const mockOriginalValue = { id: '100', label: 'F1', position: 1, type: 'DEEP', leftSide: { id: '200' }, rightSide: { id: '201' } };
        const error = new Error('DB Error Frame');
        mockUpsertFrame.mockRejectedValue(error);
        await expect((writeHooks.Frame as any)(mockParent, mockValue, { originalValue: mockOriginalValue })).rejects.toThrow(error);
        expect(mockUpsertFrame).toHaveBeenCalledTimes(1);
    });
  });

  describe('FrameSide', () => {
    it('should convert id to number if present and call upsertFrameSide', async () => {
        const mockFrameSide = { id: '300', side: 'left', frameId: '100' };
        const expectedFrameSide = { id: 300, side: 'left', frameId: '100' };
        await (writeHooks.FrameSide as any)(null, mockFrameSide, {} as any);
        expect(mockUpsertFrameSide).toHaveBeenCalledTimes(1);
        expect(mockUpsertFrameSide).toHaveBeenCalledWith(expectedFrameSide);
    });
     it('should call upsertFrameSide even if id is null/undefined', async () => {
        const mockFrameSide = { id: null, side: 'right', frameId: '101' };
        const expectedFrameSide = { id: null, side: 'right', frameId: '101' };
        await (writeHooks.FrameSide as any)(null, mockFrameSide, {} as any);
        expect(mockUpsertFrameSide).toHaveBeenCalledTimes(1);
        expect(mockUpsertFrameSide).toHaveBeenCalledWith(expectedFrameSide);
    });
     it('should propagate errors from upsertFrameSide', async () => {
        const mockFrameSide = { id: '301', side: 'left', frameId: '102' };
        const error = new Error('DB Error FrameSide');
        mockUpsertFrameSide.mockRejectedValue(error);
        await expect((writeHooks.FrameSide as any)(null, mockFrameSide, {} as any)).rejects.toThrow(error);
        expect(mockUpsertFrameSide).toHaveBeenCalledTimes(1);
    });
  });

  describe('FileResize', () => {
    it('should add numeric file_id from parent and call upsertFileResize', async () => {
        const mockParent = { id: '500' };
        const mockEntity = { id: '600', width: 100, height: 80, url: 'url1' };
        const expectedEntity = { ...mockEntity, file_id: 500 };
        await (writeHooks.FileResize as any)(mockParent, mockEntity, {} as any);
        expect(mockUpsertFileResize).toHaveBeenCalledTimes(1);
        expect(mockUpsertFileResize).toHaveBeenCalledWith(expectedEntity);
    });
     it('should propagate errors from upsertFileResize', async () => {
        const mockParent = { id: '501' };
        const mockEntity = { id: '601', width: 200, height: 160, url: 'url2' };
        const error = new Error('DB Error FileResize');
        mockUpsertFileResize.mockRejectedValue(error);
        await expect((writeHooks.FileResize as any)(mockParent, mockEntity, {} as any)).rejects.toThrow(error);
        expect(mockUpsertFileResize).toHaveBeenCalledTimes(1);
    });
  });

  // --- Updated FrameSideInspection Tests ---
  describe('FrameSideInspection', () => {
    it('should call upsertFrameSideInspection from the model', async () => {
        const mockEntity = { inspectionId: '1000', frameSideId: '300', file: { id: '500' } };
        await (writeHooks.FrameSideInspection as any)(null, mockEntity, {} as any);
        expect(mockUpsertFrameSideInspection).toHaveBeenCalledTimes(1);
        expect(mockUpsertFrameSideInspection).toHaveBeenCalledWith(mockEntity);
    });
     it('should propagate errors from upsertFrameSideInspection model function', async () => {
        const mockEntity = { inspectionId: '1001', frameSideId: '301', notes: 'fail' };
        const error = new Error('DB Error from Model');
        mockUpsertFrameSideInspection.mockRejectedValue(error);
        await expect((writeHooks.FrameSideInspection as any)(null, mockEntity, {} as any)).rejects.toThrow(error);
        expect(mockUpsertFrameSideInspection).toHaveBeenCalledTimes(1);
    });
  });
  // --- End Updated FrameSideInspection Tests ---

  describe('FrameSideFile', () => {
    it('should call frameSideFileModel.upsertEntity with entity and originalValue', async () => {
        const mockParent = { id: '305' };
        const mockEntity: any = { id: '700', file_id: '505', is_primary: true };
        const mockOriginalValue = { id: '700', file: { id: '505' }, is_primary: true };
        await writeHooks.FrameSideFile(mockParent, mockEntity, { originalValue: mockOriginalValue });
        expect(mockFrameSideFileUpsert).toHaveBeenCalledTimes(1);
        expect(mockFrameSideFileUpsert).toHaveBeenCalledWith(mockEntity, mockOriginalValue);
    });
     it('should propagate errors from frameSideFileModel.upsertEntity', async () => {
        const mockParent = { id: '306' };
        const mockEntity: any = { id: '701', file_id: '506', is_primary: false };
        const mockOriginalValue = { id: '701', file: { id: '506' }, is_primary: false };
        const error = new Error('DB Error FrameSideFile');
        mockFrameSideFileUpsert.mockRejectedValue(error);
        await expect(writeHooks.FrameSideFile(mockParent, mockEntity, { originalValue: mockOriginalValue })).rejects.toThrow(error);
        expect(mockFrameSideFileUpsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('FrameSideCells', () => {
    it('should convert percentages and id to numbers and call upsertEntityWithNumericID', async () => {
        const mockCells: any = { id: '310', broodPercent: '10.5', cappedBroodPercent: '5', eggsPercent: '2.2', pollenPercent: '3', honeyPercent: '20' };
        const expectedEntity = { id: 310, frameSideId: 310, broodPercent: 10.5, cappedBroodPercent: 5, eggsPercent: 2.2, pollenPercent: 3, honeyPercent: 20 };
        await writeHooks.FrameSideCells(null, mockCells, {} as any);
        expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
        expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('files_frame_side_cells', expectedEntity);
    });
     it('should handle missing percentage fields by defaulting to 0', async () => {
        const mockCells: any = { id: '311', broodPercent: '15', pollenPercent: null, honeyPercent: undefined };
         const expectedEntity = { id: 311, frameSideId: 311, broodPercent: 15, cappedBroodPercent: 0, eggsPercent: 0, pollenPercent: 0, honeyPercent: 0 };
        await writeHooks.FrameSideCells(null, mockCells, {} as any);
        expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
        expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('files_frame_side_cells', expectedEntity);
    });
     it('should return early if cells object is empty', async () => {
        const mockCells = {};
        await writeHooks.FrameSideCells(null, mockCells as any, {} as any);
        expect(mockUpsertEntityWithNumericID).not.toHaveBeenCalled();
    });
     it('should propagate errors from upsertEntityWithNumericID', async () => {
        const mockCells: any = { id: '312', broodPercent: '5' };
        const error = new Error('DB Error FrameSideCells');
        mockUpsertEntityWithNumericID.mockRejectedValue(error);
        await expect(writeHooks.FrameSideCells(null, mockCells, {} as any)).rejects.toThrow(error);
        expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
  });

  describe('File', () => {
    it('should call upsertEntityWithNumericID with "file" and the entity', async () => {
      const mockEntity = { id: '510', name: 'image.jpg', url: 'url3' };
      await (writeHooks.File as any)(null, mockEntity, {} as any);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('file', mockEntity);
    });
     it('should propagate errors from upsertEntityWithNumericID', async () => {
       const mockEntity = { id: '511', name: 'image2.jpg', url: 'url4' };
       const error = new Error('DB Error File');
       mockUpsertEntityWithNumericID.mockRejectedValue(error);
       await expect((writeHooks.File as any)(null, mockEntity, {} as any)).rejects.toThrow(error);
       expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
  });

  describe('Inspection', () => {
    it('should convert hiveId to number and call upsertEntityWithNumericID', async () => {
      const mockEntity = { id: '1010', hiveId: '8', date: '2024-01-01' };
      const expectedEntity = { ...mockEntity, hiveId: 8 };
      await (writeHooks.Inspection as any)(null, mockEntity, {} as any);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('inspection', expectedEntity);
    });
     it('should propagate errors from upsertEntityWithNumericID', async () => {
       const mockEntity = { id: '1011', hiveId: '9', date: '2024-01-02' };
       const error = new Error('DB Error Inspection');
       mockUpsertEntityWithNumericID.mockRejectedValue(error);
       await expect((writeHooks.Inspection as any)(null, mockEntity, {} as any)).rejects.toThrow(error);
       expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
  });

  describe('User', () => {
    it('should call upsertEntityWithNumericID with "user" and the entity', async () => {
      const mockEntity = { id: '1', email: 'test@example.com' };
      await (writeHooks.User as any)(null, mockEntity, {} as any);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('user', mockEntity);
    });
     it('should propagate errors from upsertEntityWithNumericID', async () => {
       const mockEntity = { id: '2', email: 'test2@example.com' };
       const error = new Error('DB Error User');
       mockUpsertEntityWithNumericID.mockRejectedValue(error);
       await expect((writeHooks.User as any)(null, mockEntity, {} as any)).rejects.toThrow(error);
       expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
  });

  describe('Locale', () => {
    it('should call upsertEntityWithNumericID with "locale" and the entity', async () => {
      const mockEntity = { id: '1', code: 'en', name: 'English' };
      await (writeHooks.Locale as any)(null, mockEntity, {} as any);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
      expect(mockUpsertEntityWithNumericID).toHaveBeenCalledWith('locale', mockEntity);
    });
     it('should propagate errors from upsertEntityWithNumericID', async () => {
       const mockEntity = { id: '2', code: 'es', name: 'Spanish' };
       const error = new Error('DB Error Locale');
       mockUpsertEntityWithNumericID.mockRejectedValue(error);
       await expect((writeHooks.Locale as any)(null, mockEntity, {} as any)).rejects.toThrow(error);
       expect(mockUpsertEntityWithNumericID).toHaveBeenCalledTimes(1);
    });
  });

});
