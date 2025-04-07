import { describe, it, expect, vi, beforeEach, Mock, afterEach } from 'vitest'; // Import Mock type
import { getUser, updateUser, User } from './user';
import { db } from './db'; // Import original db for type info if needed, but we mock it

// Mock the entire db module
// Define mocks *inside* the factory function to avoid hoisting issues
vi.mock('./db', () => {
  const mockToArray = vi.fn();
  const mockPut = vi.fn();
  return {
    db: {
      user: {
        toArray: mockToArray,
        put: mockPut,
      },
      // Expose mocks for test access if needed, though direct import is usually better
      __mocks: { mockToArray, mockPut }
    },
  };
});

// Import the mocked db *after* vi.mock call
// We need a way to access the mock functions for setup/assertions
// Cast db to 'any' to access the mocked 'user' property without TS error
const mockedDbUser = (db as any).user as { toArray: Mock, put: Mock };


describe('User Model', () => {
  beforeEach(() => {
    // ARRANGE: Reset mocks before each test using the reference from the mocked module
    mockedDbUser.toArray.mockReset();
    mockedDbUser.put.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {}); // Suppress console.error
  });

  afterEach(() => {
      vi.restoreAllMocks(); // Restore console.error
  });

  describe('getUser', () => {
    it('should return the user if found in the database', async () => {
      // ARRANGE
      const mockUser: User = { id: 1, email: 'test@example.com', first_name: 'Test' };
      mockedDbUser.toArray.mockResolvedValue([mockUser]);

      // ACT
      const user = await getUser();

      // ASSERT
      expect(user).toEqual(mockUser);
      expect(mockedDbUser.toArray).toHaveBeenCalledTimes(1);
    });

    it('should return null if no user is found', async () => {
      // ARRANGE
      mockedDbUser.toArray.mockResolvedValue([]);

      // ACT
      const user = await getUser();

      // ASSERT
      expect(user).toBeNull();
      expect(mockedDbUser.toArray).toHaveBeenCalledTimes(1);
    });

    it('should throw an error if the database operation fails', async () => {
      // ARRANGE
      const mockError = new Error('Database error');
      mockedDbUser.toArray.mockRejectedValue(mockError);
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // ACT & ASSERT
      await expect(getUser()).rejects.toThrowError(mockError.message);
      expect(mockedDbUser.toArray).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
    });
  });

  describe('updateUser', () => {
    it('should call db.put with the user data and numeric ID', async () => {
      // ARRANGE
      const userData: User = { id: '2' as any, email: 'update@example.com', last_name: 'User' };
      const expectedData = { ...userData, id: 2 }; // ID should be converted to number
      mockedDbUser.put.mockResolvedValue(2);

      // ACT
      await updateUser(userData);

      // ASSERT
      expect(mockedDbUser.put).toHaveBeenCalledTimes(1);
      expect(mockedDbUser.put).toHaveBeenCalledWith(expectedData);
    });

    it('should throw an error if db.put fails', async () => {
      // ARRANGE
      const userData: User = { id: 3, email: 'fail@example.com' };
      const mockError = new Error('Failed to put');
      mockedDbUser.put.mockRejectedValue(mockError);
      const consoleErrorSpy = vi.spyOn(console, 'error');

      // ACT & ASSERT
      await expect(updateUser(userData)).rejects.toThrowError(mockError.message);
      expect(mockedDbUser.put).toHaveBeenCalledTimes(1);
      expect(mockedDbUser.put).toHaveBeenCalledWith(userData);
      expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
    });
  });
});
