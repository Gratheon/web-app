import { describe, expect, it } from 'vitest'

import { buildActiveHiveCountBySystemId, pickDefaultReplacementSystem } from './boxSystems.helpers'

describe('boxSystems page helpers', () => {
	it('counts hives by box system id across apiaries', () => {
		const counts = buildActiveHiveCountBySystemId([
			{ hives: [{ boxSystemId: '1' }, { boxSystemId: '2' }] },
			{ hives: [{ boxSystemId: '1' }, { boxSystemId: null }] },
		])

		expect(counts).toEqual({
			1: 2,
			2: 1,
		})
	})

	it('prefers default replacement and falls back to first non-archived system', () => {
		const systems = [
			{ id: '1', isDefault: false },
			{ id: '2', isDefault: true },
			{ id: '3', isDefault: false },
		]

		expect(pickDefaultReplacementSystem(systems, '3')?.id).toBe('2')
		expect(pickDefaultReplacementSystem(systems, '2')?.id).toBe('1')
		expect(pickDefaultReplacementSystem([{ id: '7', isDefault: true }], '7')).toBeNull()
	})
})
