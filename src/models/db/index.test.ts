import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest';
import { DB_VERSION } from './index'; // Import constant needed for mocks

// Hoist all mock definitions
const mocks = vi.hoisted(() => {
    const mockDbDelete = vi.fn();
    const mockDbClose = vi.fn();
    const mockDbStores = vi.fn();
    const mockDbVersion = vi.fn().mockReturnValue({ stores: mockDbStores });
    const mockDbGet = vi.fn();
    const mockDbPut = vi.fn();
    const mockDbTable = { get: mockDbGet, put: mockDbPut };
    const mockAddCustomIndexes = vi.fn(); // Hoist this mock

    // Mock the Dexie constructor behavior
    const MockDexie = vi.fn().mockImplementation(() => ({
        delete: mockDbDelete,
        close: mockDbClose,
        version: mockDbVersion,
        table: vi.fn().mockReturnValue(mockDbTable), // Generic table access
        // Add specific tables if needed by the code under test (index.ts)
        user: mockDbTable,
        apiary: mockDbTable,
        hive: mockDbTable,
        files_frame_side_cells: mockDbTable,
        // Add any other tables accessed directly in index.ts
    }));

    return {
        mockDbDelete, mockDbClose, mockDbStores, mockDbVersion,
        mockDbGet, mockDbPut, mockDbTable, mockAddCustomIndexes,
        MockDexie
    };
});


// Mock isDev module first (can stay as is, doesn't depend on hoisted vars)
vi.mock('@/isDev', () => ({
  default: () => false
}));

// Mock the addCustomIndexes module using the hoisted mock
vi.mock('./addCustomIndexes', () => ({
  addCustomIndexes: mocks.mockAddCustomIndexes, // Use hoisted mock
}));

// Mock Dexie using the hoisted mocks
vi.mock('dexie', () => ({
    default: mocks.MockDexie, // Use hoisted mock constructor
    Dexie: mocks.MockDexie,   // Mock named export too
    debug: false,
}));


// Now import the functions to test after all mocks are set up
import {
  dropDatabase,
  syncGraphqlSchemaToIndexDB,
  upsertEntityWithNumericID,
  upsertEntity,
  // DB_VERSION // Already imported above
} from './index';

// Import other dependencies (their mocks will be used)
// import Dexie from 'dexie'; // Not needed as we mock it
// import { addCustomIndexes } from './addCustomIndexes'; // Not needed as we mock it


describe('Database Index Functions (./index.ts)', () => {

  beforeEach(() => {
    // ARRANGE: Reset all mocks using the hoisted 'mocks' object
    mocks.mockDbDelete.mockReset();
    mocks.mockDbClose.mockReset();
    mocks.mockDbVersion.mockReset().mockReturnValue({ stores: mocks.mockDbStores }); // Re-apply return value
    mocks.mockDbStores.mockReset();
    mocks.mockDbGet.mockReset();
    mocks.mockDbPut.mockReset();
    mocks.mockAddCustomIndexes.mockReset(); // Use hoisted mock

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'trace').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
      vi.restoreAllMocks();
  });

  describe('dropDatabase', () => {
    it('should call db.delete() and then db.close()', async () => {
    mocks.mockDbDelete.mockResolvedValue(undefined);
    mocks.mockDbClose.mockResolvedValue(undefined);
    await dropDatabase();
    expect(mocks.mockDbDelete).toHaveBeenCalledTimes(1);
    expect(mocks.mockDbClose).toHaveBeenCalledTimes(1);
  });
   it('should propagate error if db.delete() fails', async () => {
    const error = new Error('Delete failed');
    mocks.mockDbDelete.mockRejectedValue(error);
    await expect(dropDatabase()).rejects.toThrow(error);
    expect(mocks.mockDbDelete).toHaveBeenCalledTimes(1);
    expect(mocks.mockDbClose).not.toHaveBeenCalled();
  });
   it('should propagate error if db.close() fails', async () => {
    const error = new Error('Close failed');
    mocks.mockDbDelete.mockResolvedValue(undefined);
    mocks.mockDbClose.mockRejectedValue(error);
    await expect(dropDatabase()).rejects.toThrow(error);
    expect(mocks.mockDbDelete).toHaveBeenCalledTimes(1);
    expect(mocks.mockDbClose).toHaveBeenCalledTimes(1);
  });
});

  describe('syncGraphqlSchemaToIndexDB', () => {
    // ARRANGE: Helper to create a mock GraphQL schema object
    const createMockSchema = (types = {}) => ({
      getTypeMap: () => ({
        Query: { astNode: { kind: 'ObjectTypeDefinition', name: { value: 'Query' } } },
        Mutation: { astNode: { kind: 'ObjectTypeDefinition', name: { value: 'Mutation' } } },
        Error: { astNode: { kind: 'ObjectTypeDefinition', name: { value: 'Error' } } },
        String: { astNode: { kind: 'ScalarTypeDefinition' } }, // Non-object type
        ...types,
      }),
    });

    it('should generate schema, call addCustomIndexes, and db.version().stores()', () => {
      // ARRANGE
      const mockSchema = createMockSchema({
        Apiary: {
          astNode: { kind: 'ObjectTypeDefinition', name: { value: 'Apiary' } },
          getFields: () => ({ id: { name: 'id' }, name: { name: 'name' }, location: { name: 'location' } }),
        },
        Hive: {
          astNode: { kind: 'ObjectTypeDefinition', name: { value: 'Hive' } },
          getFields: () => ({ id: { name: 'id' }, apiaryId: { name: 'apiaryId' } }),
        },
         Framesidecells: {
             astNode: { kind: 'ObjectTypeDefinition', name: { value: 'Framesidecells' } },
             getFields: () => ({ id: { name: 'id' }, count: { name: 'count' } }),
         },
      });
      const expectedDbSchema = {
        apiary: '&id, name, location',
        hive: '&id, apiaryId',
        files_frame_side_cells: '&id, count', // Mapped name
      };
      syncGraphqlSchemaToIndexDB(mockSchema);
      expect(mocks.mockAddCustomIndexes).toHaveBeenCalledTimes(1); // Use hoisted mock
      expect(mocks.mockAddCustomIndexes).toHaveBeenCalledWith(expectedDbSchema);
      expect(mocks.mockDbVersion).toHaveBeenCalledTimes(1);
      expect(mocks.mockDbVersion).toHaveBeenCalledWith(DB_VERSION);
      expect(mocks.mockDbStores).toHaveBeenCalledTimes(1);
      expect(mocks.mockDbStores).toHaveBeenCalledWith(expectedDbSchema);
    });
     it('should skip Query, Mutation, Error types and non-ObjectTypeDefinitions', () => {
        // ARRANGE
        const mockSchema = createMockSchema({
            MyType: { astNode: { kind: 'ObjectTypeDefinition', name: { value: 'MyType' } }, getFields: () => ({ id: { name: 'id' } }) },
            MyInput: { astNode: { kind: 'InputObjectTypeDefinition' } },
        });
        const expectedDbSchema = { mytype: '&id' };

        syncGraphqlSchemaToIndexDB(mockSchema);
        expect(mocks.mockAddCustomIndexes).toHaveBeenCalledWith(expectedDbSchema); // Use hoisted mock
        expect(mocks.mockDbStores).toHaveBeenCalledWith(expectedDbSchema);
        expect(Object.keys(mocks.mockDbStores.mock.calls[0][0])).toEqual(['mytype']);
    });
  });

  // NOTE: Tests for upsertEntityWithNumericID and upsertEntity remain largely the same,
  // but assertions will now target the Dexie mocks (mockDbGet, mockDbPut) directly.
  // The dynamic mocking of upsertEntity within upsertEntityWithNumericID tests is no longer needed.

  describe('upsertEntityWithNumericID', () => {
    const entityName = 'some_table';


    it('should log trace and return early if entity is null/undefined', async () => {
        // ARRANGE
        const consoleTraceSpy = vi.spyOn(console, 'trace');

        // ACT
        await upsertEntityWithNumericID(entityName, null);
        await upsertEntityWithNumericID(entityName, undefined);

        expect(consoleTraceSpy).toHaveBeenCalledTimes(2);
        expect(mocks.mockDbGet).not.toHaveBeenCalled(); // Use hoisted mock
        expect(mocks.mockDbPut).not.toHaveBeenCalled(); // Use hoisted mock
    });
    it('should log warning and return early if entity has no ID', async () => {
        // ARRANGE
        const consoleWarnSpy = vi.spyOn(console, 'warn');
        const entity = { value: 'no id' };

        // ACT
        await upsertEntityWithNumericID(entityName, entity as any);

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        expect(mocks.mockDbGet).not.toHaveBeenCalled(); // Use hoisted mock
        expect(mocks.mockDbPut).not.toHaveBeenCalled(); // Use hoisted mock
    });
  });

  describe('upsertEntity', () => {
     const entityName = 'user';
     const entityId = 1;

    it('should merge existing entity with new entity data and call db.put', async () => {
      // ARRANGE
      const existingEntity = { id: entityId, email: 'old@example.com', name: 'Old Name' };
      const newEntityData = { id: entityId, email: 'new@example.com', age: 30 };
      const expectedMergedEntity = { id: entityId, email: 'new@example.com', name: 'Old Name', age: 30 };
      mocks.mockDbGet.mockResolvedValue(existingEntity); // Use hoisted mock
      mocks.mockDbPut.mockResolvedValue(entityId); // Use hoisted mock
      await upsertEntity(entityName, newEntityData);
      expect(mocks.mockDbGet).toHaveBeenCalledTimes(1); // Use hoisted mock
      expect(mocks.mockDbGet).toHaveBeenCalledWith(entityId);
      expect(mocks.mockDbPut).toHaveBeenCalledTimes(1); // Use hoisted mock
      expect(mocks.mockDbPut).toHaveBeenCalledWith(expectedMergedEntity);
    });
    it('should call db.put with only new data if entity does not exist', async () => {
        const newEntityData = { id: entityId, email: 'new@example.com', age: 30 };
        mocks.mockDbGet.mockResolvedValue(undefined); // Use hoisted mock
        mocks.mockDbPut.mockResolvedValue(entityId); // Use hoisted mock
        await upsertEntity(entityName, newEntityData);
        expect(mocks.mockDbGet).toHaveBeenCalledTimes(1); // Use hoisted mock
        expect(mocks.mockDbGet).toHaveBeenCalledWith(entityId);
        expect(mocks.mockDbPut).toHaveBeenCalledTimes(1); // Use hoisted mock
        expect(mocks.mockDbPut).toHaveBeenCalledWith(newEntityData);
    });
     it('should convert entityName to lowercase', async () => {
        const entityNameUpper = 'USER';
        const newEntityData = { id: entityId, email: 'test@test.com' };
        mocks.mockDbGet.mockResolvedValue(undefined); // Use hoisted mock
        mocks.mockDbPut.mockResolvedValue(entityId); // Use hoisted mock
        await upsertEntity(entityNameUpper, newEntityData);
        expect(mocks.mockDbGet).toHaveBeenCalledTimes(1); // Use hoisted mock
        expect(mocks.mockDbPut).toHaveBeenCalledTimes(1); // Use hoisted mock
        expect(mocks.mockDbPut).toHaveBeenCalledWith(newEntityData);
    });
    it('should throw and log error if db.get fails', async () => {
        const newEntityData = { id: entityId, email: 'fail@get.com' };
        const error = new Error('Get failed');
        mocks.mockDbGet.mockRejectedValue(error); // Use hoisted mock
        const consoleErrorSpy = vi.spyOn(console, 'error');
        await expect(upsertEntity(entityName, newEntityData)).rejects.toThrow(error);
        expect(mocks.mockDbGet).toHaveBeenCalledTimes(1); // Use hoisted mock
        expect(mocks.mockDbPut).not.toHaveBeenCalled(); // Use hoisted mock
        expect(consoleErrorSpy).toHaveBeenCalledWith(error, newEntityData);
    });
     it('should throw and log error if db.put fails', async () => {
        const newEntityData = { id: entityId, email: 'fail@put.com' };
        const error = new Error('Put failed');
        mocks.mockDbGet.mockResolvedValue(undefined); // Use hoisted mock
        mocks.mockDbPut.mockRejectedValue(error); // Use hoisted mock
        const consoleErrorSpy = vi.spyOn(console, 'error');
        await expect(upsertEntity(entityName, newEntityData)).rejects.toThrow(error);
        expect(mocks.mockDbGet).toHaveBeenCalledTimes(1); // Use hoisted mock
        expect(mocks.mockDbPut).toHaveBeenCalledTimes(1); // Use hoisted mock
        expect(consoleErrorSpy).toHaveBeenCalledWith(error, newEntityData);
    });
  });
});
