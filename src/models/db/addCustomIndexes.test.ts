import { describe, it, expect } from 'vitest';
import { addCustomIndexes } from './addCustomIndexes';

describe('addCustomIndexes', () => {
  it('should append custom indexes to the provided dbSchema object', () => {
    // ARRANGE
    const mockDbSchema = {
      family: '&id, name',
      box: '&id, size',
      file: '&id, filename, type',
      frame: '&id, label',
      frameside: '&id, side',
      frame_side_inspection: '&id, date',
      files_frame_side_cells: '&id, count',
      frame_side_file: '&id, path',
      // Add other tables if necessary for completeness, though not strictly needed for this test
      apiary: '&id, location',
      hive: '&id, apiaryId',
    };

    // ACT
    addCustomIndexes(mockDbSchema);

    // ASSERT
    expect(mockDbSchema.family).toBe('&id, name,hiveId');
    expect(mockDbSchema.box).toBe('&id, size,hiveId,[hiveId+position]');
    expect(mockDbSchema.file).toBe('&id, filename, type,hiveId');
    expect(mockDbSchema.frame).toBe('&id, label,boxId,hiveId,leftId,rightId');
    expect(mockDbSchema.frameside).toBe('&id, side,frameId');
    expect(mockDbSchema.frame_side_inspection).toBe('&id, date,[frameSideId+inspectionId]');
    expect(mockDbSchema.files_frame_side_cells).toBe('&id, count,frameSideId');
    expect(mockDbSchema.frame_side_file).toBe('&id, path,id'); // Checks if 'id' index is added

    // Assert that tables not explicitly modified remain unchanged
    expect(mockDbSchema.apiary).toBe('&id, location');
    expect(mockDbSchema.hive).toBe('&id, apiaryId');
  });

  it('should handle cases where initial schema strings are empty or missing', () => {
     // ARRANGE
     const mockDbSchema = {
      family: '',
      box: '&id',
      // file is missing
      frame: '&id, label',
      frameside: undefined, // Test undefined case
      frame_side_inspection: '&id',
      files_frame_side_cells: '&id',
      frame_side_file: '&id',
    };

     // ACT
     addCustomIndexes(mockDbSchema);

     // ASSERT
     expect(mockDbSchema.family).toBe(',hiveId');
     expect(mockDbSchema.box).toBe('&id,hiveId,[hiveId+position]');
     // If 'file' doesn't exist, accessing it results in undefined + ',hiveId' -> "undefined,hiveId"
     // The property *is* added during the operation in the source code.
     expect((mockDbSchema as any).file).toBe('undefined,hiveId');
     expect(mockDbSchema.frame).toBe('&id, label,boxId,hiveId,leftId,rightId');
     // If frameside was undefined, it remains undefined, index is not added.
     expect(mockDbSchema.frame_side_inspection).toBe('&id,[frameSideId+inspectionId]');
     expect(mockDbSchema.files_frame_side_cells).toBe('&id,frameSideId');
     expect(mockDbSchema.frame_side_file).toBe('&id,id');
  });
});
