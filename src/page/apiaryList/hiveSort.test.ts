import { describe, expect, it } from 'vitest'

import { sortHives } from './hiveSort'
import { getColonyStatusLabel, getHiveFamilies } from './hivePresentation'

describe('apiary list multi-queen helpers', () => {
	it('orders families deterministically by year then name', () => {
		const families = getHiveFamilies({
			families: [
				{ id: 3, name: 'Zeta', added: '2024' },
				{ id: 1, name: 'Alpha', added: '2023' },
				{ id: 2, name: 'Beta', added: '2023' },
			],
		})

		expect(families.map((family) => family.name)).toEqual(['Alpha', 'Beta', 'Zeta'])
	})

	it('marks hive as multi-queen when more than one queen exists', () => {
		expect(
			getColonyStatusLabel({
				status: 'active',
				families: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
			}),
		).toBe('multi-queen')
	})
})

describe('sortHives multi-queen sorting', () => {
	it('sorts queen column by primary queen name, then queen count desc as tiebreaker', () => {
		const hives = [
			{
				id: 1,
				hiveNumber: 1,
				families: [{ id: 1, name: 'Anna', added: '2023' }],
			},
			{
				id: 2,
				hiveNumber: 2,
				families: [
					{ id: 2, name: 'Anna', added: '2022' },
					{ id: 3, name: 'Bea', added: '2024' },
				],
			},
			{
				id: 3,
				hiveNumber: 3,
				families: [{ id: 4, name: 'Bella', added: '2023' }],
			},
		]

		const sorted = sortHives(hives, 'QUEEN', 'ASC')
		expect(sorted.map((hive) => hive.id)).toEqual([2, 1, 3])
	})
})
