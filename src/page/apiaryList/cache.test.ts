import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	mockApiaryToArray: vi.fn(),
	mockHiveToArray: vi.fn(),
	mockBoxToArray: vi.fn(),
	mockFamilyToArray: vi.fn(),
	mockBoxSystemToArray: vi.fn(),
}))

vi.mock('@/models/db', () => ({
	db: {
		apiary: { toArray: mocks.mockApiaryToArray },
		hive: { toArray: mocks.mockHiveToArray },
		box: { toArray: mocks.mockBoxToArray },
		family: { toArray: mocks.mockFamilyToArray },
		boxsystem: { toArray: mocks.mockBoxSystemToArray },
	},
}))

import { getCachedApiaryListData } from './cache'

describe('apiary list cache', () => {
	beforeEach(() => {
		mocks.mockApiaryToArray.mockReset()
		mocks.mockHiveToArray.mockReset()
		mocks.mockBoxToArray.mockReset()
		mocks.mockFamilyToArray.mockReset()
		mocks.mockBoxSystemToArray.mockReset()
		mocks.mockApiaryToArray.mockResolvedValue([])
		mocks.mockHiveToArray.mockResolvedValue([])
		mocks.mockBoxToArray.mockResolvedValue([])
		mocks.mockFamilyToArray.mockResolvedValue([])
		mocks.mockBoxSystemToArray.mockResolvedValue([])
	})

	it('rebuilds nested apiary listing from normalized IndexedDB tables', async () => {
		mocks.mockApiaryToArray.mockResolvedValue([{ id: 1, name: 'Main apiary' }])
		mocks.mockHiveToArray.mockResolvedValue([
			{ id: 10, apiaryId: 1, hiveNumber: 1 },
			{ id: 20, apiaryId: 2, hiveNumber: 2 },
		])
		mocks.mockBoxToArray.mockResolvedValue([
			{ id: 101, hiveId: 10, position: 2 },
			{ id: 100, hiveId: 10, position: 1 },
		])
		mocks.mockFamilyToArray.mockResolvedValue([
			{ id: 1000, hiveId: 10, name: 'Queen A' },
		])
		mocks.mockBoxSystemToArray.mockResolvedValue([
			{ id: 1, name: 'Dadant', isDefault: true },
		])

		const data = await getCachedApiaryListData()

		expect(data).toEqual({
			apiaries: [
				{
					id: 1,
					name: 'Main apiary',
					hives: [
						{
							id: 10,
							apiaryId: 1,
							hiveNumber: 1,
							family: { id: 1000, hiveId: 10, name: 'Queen A' },
							families: [{ id: 1000, hiveId: 10, name: 'Queen A' }],
							boxes: [
								{ id: 100, hiveId: 10, position: 1 },
								{ id: 101, hiveId: 10, position: 2 },
							],
						},
					],
				},
			],
			boxSystems: [{ id: 1, name: 'Dadant', isDefault: true }],
		})
	})
})
