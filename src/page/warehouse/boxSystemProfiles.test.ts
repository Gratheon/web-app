import { describe, expect, it, vi } from 'vitest'

import {
	applyFrameSourceToAllBoxTypes,
	buildFrameSettingLookup,
	FRAME_BOX_TYPE_ORDER,
	getCurrentFrameProfileSource,
	hasExplicitOwnFrameMapping,
} from './boxSystemProfiles'

describe('boxSystemProfiles helpers', () => {
	it('builds frame setting lookup and resolves a uniform source', () => {
		const lookup = buildFrameSettingLookup([
			{ systemId: '10', boxType: 'DEEP', frameSourceSystemId: '1' },
			{ systemId: '10', boxType: 'SUPER', frameSourceSystemId: '1' },
			{ systemId: '10', boxType: 'LARGE_HORIZONTAL_SECTION', frameSourceSystemId: '1' },
		])

		expect(getCurrentFrameProfileSource('10', lookup)).toBe('1')
		expect(hasExplicitOwnFrameMapping('10', lookup)).toBe(false)
	})

	it('returns __MIXED__ when box types point to different sources', () => {
		const lookup = buildFrameSettingLookup([
			{ systemId: '10', boxType: 'DEEP', frameSourceSystemId: '1' },
			{ systemId: '10', boxType: 'SUPER', frameSourceSystemId: '2' },
			{ systemId: '10', boxType: 'LARGE_HORIZONTAL_SECTION', frameSourceSystemId: '1' },
		])

		expect(getCurrentFrameProfileSource('10', lookup)).toBe('__MIXED__')
	})

	it('detects explicit own frame mapping', () => {
		const lookup = buildFrameSettingLookup([
			{ systemId: '10', boxType: 'DEEP', frameSourceSystemId: '10' },
			{ systemId: '10', boxType: 'SUPER', frameSourceSystemId: '10' },
			{ systemId: '10', boxType: 'LARGE_HORIZONTAL_SECTION', frameSourceSystemId: '10' },
		])

		expect(hasExplicitOwnFrameMapping('10', lookup)).toBe(true)
		expect(getCurrentFrameProfileSource('10', lookup)).toBe('10')
	})

	it('applies frame source update to all configurable box types', async () => {
		const setFrameSource = vi.fn().mockResolvedValue({})

		await applyFrameSourceToAllBoxTypes(setFrameSource, '10', '42')

		expect(setFrameSource).toHaveBeenCalledTimes(FRAME_BOX_TYPE_ORDER.length)
		expect(setFrameSource.mock.calls.map(([input]) => input.boxType)).toEqual(FRAME_BOX_TYPE_ORDER)
		expect(setFrameSource.mock.calls.every(([input]) => input.systemId === '10')).toBe(true)
		expect(setFrameSource.mock.calls.every(([input]) => input.frameSourceSystemId === '42')).toBe(true)
	})
})
