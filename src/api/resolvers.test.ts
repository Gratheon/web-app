import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	mockApiaryFirst: vi.fn(),
	mockApiaryToArray: vi.fn(),
	mockHiveToArray: vi.fn(),
	mockBoxToArray: vi.fn(),
	mockFamilyToArray: vi.fn(),
	mockBoxSystemToArray: vi.fn(),
	mockFamilyAnyOf: vi.fn(),
	mockFamilyWhere: vi.fn(),
}))

vi.mock('@/models/db', () => ({
	db: {
		apiary: {
			where: vi.fn(() => ({
				first: mocks.mockApiaryFirst,
			})),
			limit: vi.fn(() => ({
				toArray: mocks.mockApiaryToArray,
			})),
		},
		hive: {
			limit: vi.fn(() => ({
				toArray: mocks.mockHiveToArray,
			})),
		},
		box: {
			limit: vi.fn(() => ({
				toArray: mocks.mockBoxToArray,
			})),
		},
		family: {
			where: mocks.mockFamilyWhere,
			limit: vi.fn(() => ({
				toArray: mocks.mockFamilyToArray,
			})),
		},
		boxsystem: {
			limit: vi.fn(() => ({
				toArray: mocks.mockBoxSystemToArray,
			})),
		},
	},
}))

import resolvers from './resolvers'
import { db } from '@/models/db'

describe('api resolvers', () => {
	beforeEach(() => {
		mocks.mockApiaryFirst.mockReset()
		mocks.mockApiaryToArray.mockReset()
		mocks.mockHiveToArray.mockReset()
		mocks.mockBoxToArray.mockReset()
		mocks.mockFamilyToArray.mockReset()
		mocks.mockBoxSystemToArray.mockReset()
		mocks.mockFamilyAnyOf.mockReset()
		mocks.mockFamilyWhere.mockReset()
		mocks.mockApiaryToArray.mockResolvedValue([])
		mocks.mockHiveToArray.mockResolvedValue([])
		mocks.mockBoxToArray.mockResolvedValue([])
		mocks.mockFamilyToArray.mockResolvedValue([])
		mocks.mockBoxSystemToArray.mockResolvedValue([])
		mocks.mockFamilyAnyOf.mockReturnValue({
			toArray: mocks.mockFamilyToArray,
		})
		mocks.mockFamilyWhere.mockReturnValue({
			anyOf: mocks.mockFamilyAnyOf,
		})
	})

	describe('apiary resolver', () => {
		it('returns apiary with related hives and family from IndexedDB', async () => {
			mocks.mockApiaryFirst.mockResolvedValue({ id: 1, name: 'Main apiary' })
			mocks.mockHiveToArray.mockResolvedValue([
				{ id: 10, hiveNumber: 1, apiaryId: 1 },
				{ id: 11, hiveNumber: 2, apiary_id: 1 },
				{ id: 20, hiveNumber: 9, apiaryId: 2 },
			])
			mocks.mockFamilyToArray.mockResolvedValue([
				{ id: 100, hiveId: 10, name: 'F1' },
				{ id: 110, hiveId: 11, name: 'F2' },
			])

			const result = await resolvers.apiary(
				null,
				{ db },
				{ variableValues: { id: '1' } }
			)

			expect(result).toEqual({
				id: 1,
				name: 'Main apiary',
				hives: [
					{
						id: 10,
						hiveNumber: 1,
						apiaryId: 1,
						family: { id: 100, hiveId: 10, name: 'F1' },
					},
					{
						id: 11,
						hiveNumber: 2,
						apiary_id: 1,
						family: { id: 110, hiveId: 11, name: 'F2' },
					},
				],
			})
			expect(mocks.mockFamilyWhere).toHaveBeenCalledWith('hiveId')
			expect(mocks.mockFamilyAnyOf).toHaveBeenCalledWith([10, 11])
		})

		it('uses legacy single-apiary fallback when hives have no apiary relation fields', async () => {
			mocks.mockApiaryFirst.mockResolvedValue({ id: 1, name: 'Legacy apiary' })
			mocks.mockHiveToArray.mockResolvedValue([
				{ id: 10, hiveNumber: 1 },
				{ id: 20, hiveNumber: 2 },
			])
			mocks.mockFamilyToArray.mockResolvedValue([])

			const result = await resolvers.apiary(
				null,
				{ db },
				{ variableValues: { id: '1' } }
			)

			expect(result?.hives).toHaveLength(2)
			expect(mocks.mockFamilyAnyOf).toHaveBeenCalledWith([10, 20])
		})

		it('returns null for invalid apiary id', async () => {
			const result = await resolvers.apiary(
				null,
				{ db },
				{ variableValues: { id: 'abc' } }
			)

			expect(result).toBeNull()
			expect(mocks.mockApiaryFirst).not.toHaveBeenCalled()
			expect(mocks.mockHiveToArray).not.toHaveBeenCalled()
		})
	})

	describe('apiaries resolver', () => {
		it('returns cached apiary listing with hives, boxes, and families', async () => {
			mocks.mockApiaryToArray.mockResolvedValue([
				{ id: 1, name: 'Main apiary' },
			])
			mocks.mockHiveToArray.mockResolvedValue([
				{ id: 10, hiveNumber: 1, apiaryId: 1 },
				{ id: 20, hiveNumber: 2, apiaryId: 2 },
			])
			mocks.mockBoxToArray.mockResolvedValue([
				{ id: 101, hiveId: 10, position: 2 },
				{ id: 100, hiveId: 10, position: 1 },
			])
			mocks.mockFamilyToArray.mockResolvedValue([
				{ id: 1000, hiveId: 10, name: 'Queen A' },
			])

			const result = await resolvers.apiaries(null, { db })

			expect(result).toEqual([
				{
					id: 1,
					name: 'Main apiary',
					hives: [
						{
							id: 10,
							hiveNumber: 1,
							apiaryId: 1,
							boxes: [
								{ id: 101, hiveId: 10, position: 2 },
								{ id: 100, hiveId: 10, position: 1 },
							],
							family: { id: 1000, hiveId: 10, name: 'Queen A' },
							families: [{ id: 1000, hiveId: 10, name: 'Queen A' }],
						},
					],
				},
			])
		})
	})

	describe('boxSystems resolver', () => {
		it('returns cached box systems from IndexedDB', async () => {
			mocks.mockBoxSystemToArray.mockResolvedValue([
				{ id: 1, name: 'Dadant', isDefault: true },
			])

			const result = await resolvers.boxSystems(null, { db })

			expect(result).toEqual([{ id: 1, name: 'Dadant', isDefault: true }])
		})
	})

	describe('warehouseQueens resolver', () => {
		it('returns cached families that are not assigned to a hive', async () => {
			mocks.mockFamilyToArray.mockResolvedValue([
				{ id: 1, hiveId: 10, name: 'Hive Queen' },
				{ id: 2, name: 'Warehouse Queen' },
				{ id: 3, hive_id: null, name: 'Legacy Warehouse Queen' },
			])

			const result = await resolvers.warehouseQueens(null, { db })

			expect(result).toEqual([
				{ id: 2, name: 'Warehouse Queen' },
				{ id: 3, hive_id: null, name: 'Legacy Warehouse Queen' },
			])
		})
	})
})
