import { describe, it, expect, vi, beforeEach, Mock, Mocked } from 'vitest' // Added Mocked
import Dexie, { Table } from 'dexie'; // Added Dexie and Table
import { db } from './db' // Mocked below
import {
	upsertFrameSideInspection,
	listFrameSideInspectionsByInspectionId,
	getFrameSideInspectionById,
	FRAME_SIDE_INSPECTION_TABLE,
	type FrameSideInspection,
	type FrameSideInspectionRecord,
} from './frameSideInspection'

// Mock the db object and its methods
vi.mock('./db', () => ({
	db: {
		table: vi.fn(),
	},
}))

describe('FrameSideInspection Model', () => {
	// Use a more specific type for the mock table
	let mockTable: Mocked<Table<FrameSideInspectionRecord, string>>; // Removed vi. prefix

	beforeEach(() => {
		// Reset mocks before each test
        // Create a mock object matching the Table interface methods we use
		mockTable = {
			put: vi.fn(),
			where: vi.fn().mockReturnThis(), // where returns the table object for chaining
			toArray: vi.fn(),
			get: vi.fn(),
		} as unknown as Mocked<Table<FrameSideInspectionRecord, string>>; // Cast needed as we don't mock all Table methods, removed vi. prefix

		// Ensure db.table returns our specifically typed mock
		vi.mocked(db.table).mockReturnValue(mockTable)
	})

	describe('upsertFrameSideInspection', () => {
		it('should correctly format and upsert a record', async () => {
			// Use numbers directly in the input for this test
			const inspectionInput: FrameSideInspection = {
				inspectionId: 101,
				frameSideId: 202,
				file: { id: 303 },
				cells: { id: 404 },
			}
			// Let TypeScript infer the type for expectedRecord
			const expectedRecord = {
				id: '101_202',
				inspectionId: 101,
				frameSideId: 202,
				fileId: 303,
				cellsId: 404,
			};
			const expectedId = expectedRecord.id

			mockTable.put.mockResolvedValue(expectedId) // Mock put to return the ID

			const result = await upsertFrameSideInspection(inspectionInput)

			expect(db.table).toHaveBeenCalledWith(FRAME_SIDE_INSPECTION_TABLE)
			expect(mockTable.put).toHaveBeenCalledWith(expectedRecord)
			expect(result).toBe(expectedId)
		})

		it('should handle missing optional fields', async () => {
			const inspectionInput: FrameSideInspection = {
				inspectionId: 101,
				frameSideId: 202,
				// file and cells are missing
			}
			const expectedRecord: FrameSideInspectionRecord = {
				id: '101_202',
				inspectionId: 101,
				frameSideId: 202,
				fileId: undefined,
				cellsId: undefined,
			}
			const expectedId = expectedRecord.id
			mockTable.put.mockResolvedValue(expectedId)

			const result = await upsertFrameSideInspection(inspectionInput)

			expect(mockTable.put).toHaveBeenCalledWith(expectedRecord)
			expect(result).toBe(expectedId)
		})

		it('should return empty string and log error for missing inspectionId', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
			const inspectionInput = { frameSideId: 202 } as FrameSideInspection
			const result = await upsertFrameSideInspection(inspectionInput)
			expect(result).toBe('')
			expect(mockTable.put).not.toHaveBeenCalled()
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'upsertFrameSideInspection: Invalid input, missing inspectionId or frameSideId',
				inspectionInput
			)
			consoleErrorSpy.mockRestore()
		})

		it('should return empty string and log error for non-numeric inspectionId', async () => {
			const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
			const inspectionInput = { inspectionId: 'abc', frameSideId: 202 } as FrameSideInspection
			const result = await upsertFrameSideInspection(inspectionInput)
			expect(result).toBe('')
			expect(mockTable.put).not.toHaveBeenCalled()
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'upsertFrameSideInspection: inspectionId or frameSideId is not a number',
				inspectionInput
			)
			consoleErrorSpy.mockRestore()
		})
	})

	describe('listFrameSideInspectionsByInspectionId', () => {
		it('should call where and toArray with correct inspectionId', async () => {
			const inspectionId = 123
			const mockData: FrameSideInspectionRecord[] = [
				{ id: '123_1', inspectionId: 123, frameSideId: 1 },
				{ id: '123_2', inspectionId: 123, frameSideId: 2 },
			]
			mockTable.toArray.mockResolvedValue(mockData)

			const result = await listFrameSideInspectionsByInspectionId(inspectionId)

			expect(db.table).toHaveBeenCalledWith(FRAME_SIDE_INSPECTION_TABLE)
			expect(mockTable.where).toHaveBeenCalledWith({ inspectionId: 123 })
			expect(mockTable.toArray).toHaveBeenCalled()
			expect(result).toEqual(mockData)
		})

		it('should return empty array for invalid inspectionId', async () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
			const result = await listFrameSideInspectionsByInspectionId(NaN)
			expect(result).toEqual([])
			expect(mockTable.where).not.toHaveBeenCalled()
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				'listFrameSideInspectionsByInspectionId: Invalid inspectionId provided: NaN'
			)
			consoleWarnSpy.mockRestore()
		})
	})

	describe('getFrameSideInspectionById', () => {
		it('should call get with the correct synthetic ID', async () => {
			const id = '123_456'
			const mockRecord: FrameSideInspectionRecord = {
				id: id,
				inspectionId: 123,
				frameSideId: 456,
			}
			mockTable.get.mockResolvedValue(mockRecord)

			const result = await getFrameSideInspectionById(id)

			expect(db.table).toHaveBeenCalledWith(FRAME_SIDE_INSPECTION_TABLE)
			expect(mockTable.get).toHaveBeenCalledWith(id)
			expect(result).toEqual(mockRecord)
		})

		it('should return undefined if record not found', async () => {
			const id = '123_456'
			mockTable.get.mockResolvedValue(undefined)

			const result = await getFrameSideInspectionById(id)

			expect(mockTable.get).toHaveBeenCalledWith(id)
			expect(result).toBeUndefined()
		})

		it('should return undefined for invalid id', async () => {
			const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
			const result = await getFrameSideInspectionById('')
			expect(result).toBeUndefined()
			expect(mockTable.get).not.toHaveBeenCalled()
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				'getFrameSideInspectionById: Invalid id provided: '
			)
			consoleWarnSpy.mockRestore()
		})
	})
})
