import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
	mockApiaryFirst: vi.fn(),
	mockHiveToArray: vi.fn(),
	mockFamilyToArray: vi.fn(),
	mockFamilyAnyOf: vi.fn(),
	mockFamilyWhere: vi.fn(),
}))

vi.mock('@/models/db', () => ({
	db: {
		apiary: {
			where: vi.fn(() => ({
				first: mocks.mockApiaryFirst,
			})),
		},
		hive: {
			limit: vi.fn(() => ({
				toArray: mocks.mockHiveToArray,
			})),
		},
		family: {
			where: mocks.mockFamilyWhere,
		},
	},
}))

import resolvers from './resolvers'
import { db } from '@/models/db'

describe('api resolvers', () => {
	beforeEach(() => {
		mocks.mockApiaryFirst.mockReset()
		mocks.mockHiveToArray.mockReset()
		mocks.mockFamilyToArray.mockReset()
		mocks.mockFamilyAnyOf.mockReset()
		mocks.mockFamilyWhere.mockReset()
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

			const result = await resolvers.apiary(null, { db }, { variableValues: { id: '1' } })

			expect(result).toEqual({
				id: 1,
				name: 'Main apiary',
				hives: [
					{ id: 10, hiveNumber: 1, apiaryId: 1, family: { id: 100, hiveId: 10, name: 'F1' } },
					{ id: 11, hiveNumber: 2, apiary_id: 1, family: { id: 110, hiveId: 11, name: 'F2' } },
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

			const result = await resolvers.apiary(null, { db }, { variableValues: { id: '1' } })

			expect(result?.hives).toHaveLength(2)
			expect(mocks.mockFamilyAnyOf).toHaveBeenCalledWith([10, 20])
		})

		it('returns null for invalid apiary id', async () => {
			const result = await resolvers.apiary(null, { db }, { variableValues: { id: 'abc' } })

			expect(result).toBeNull()
			expect(mocks.mockApiaryFirst).not.toHaveBeenCalled()
			expect(mocks.mockHiveToArray).not.toHaveBeenCalled()
		})
	})
})
