import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	mockFamilyToArray: vi.fn(),
	mockHiveToArray: vi.fn(),
}))

vi.mock('@/models/db', () => ({
	db: {
		family: { toArray: mocks.mockFamilyToArray },
		hive: { toArray: mocks.mockHiveToArray },
	},
}))

import { getCachedQueenListData, getCachedQueenListSnapshot } from './queens.cache'

describe('queen list cache', () => {
	beforeEach(() => {
		mocks.mockFamilyToArray.mockReset()
		mocks.mockHiveToArray.mockReset()
		mocks.mockFamilyToArray.mockResolvedValue([])
		mocks.mockHiveToArray.mockResolvedValue([])
	})

	it('splits cached families into assigned and warehouse queens', async () => {
		mocks.mockFamilyToArray.mockResolvedValue([
			{ id: 1, hiveId: 10, name: 'Hive Queen' },
			{ id: 2, name: 'Warehouse Queen' },
			{ id: 3, hive_id: null, name: 'Legacy Warehouse Queen' },
		])
		mocks.mockHiveToArray.mockResolvedValue([
			{ id: 10, apiaryId: 100, hiveNumber: 4 },
		])

		const data = await getCachedQueenListData()

		expect(data).toEqual({
			assignedFamilies: [
				{ id: 1, hiveId: 10, name: 'Hive Queen' },
			],
			unassignedFamilies: [
				{ id: 2, name: 'Warehouse Queen' },
				{ id: 3, hive_id: null, name: 'Legacy Warehouse Queen' },
			],
			allFamilies: [
				{ id: 1, hiveId: 10, name: 'Hive Queen' },
				{ id: 2, name: 'Warehouse Queen' },
				{ id: 3, hive_id: null, name: 'Legacy Warehouse Queen' },
			],
			hives: [
				{ id: 10, apiaryId: 100, hiveNumber: 4 },
			],
		})
		expect(getCachedQueenListSnapshot()).toEqual(data)
	})
})
