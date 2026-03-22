import { describe, expect, it } from 'vitest'
import { buildOccupiedFamilyIds } from './queenAvailability'

describe('buildOccupiedFamilyIds', () => {
	it('excludes a queen seen on another frame in the same hive', () => {
		const occupied = buildOccupiedFamilyIds({
			queenAnnotations: [],
			families: [
				{ id: 11, lastSeenFrameId: 101 },
				{ id: 12, lastSeenFrameId: 102 },
			],
			currentFrameId: 102,
			currentFrameSideId: 999,
		})

		expect(occupied.has(11)).toBe(true)
		expect(occupied.has(12)).toBe(false)
	})

	it('keeps queen available when last seen on current side', () => {
		const occupied = buildOccupiedFamilyIds({
			queenAnnotations: [],
			families: [
				{ id: 21, lastSeenFrameSideId: 501 },
			],
			currentFrameId: 201,
			currentFrameSideId: 501,
		})

		expect(occupied.has(21)).toBe(false)
	})

	it('includes family ids already assigned in current annotations', () => {
		const occupied = buildOccupiedFamilyIds({
			queenAnnotations: [
				{
					id: 'manual-1',
					x: 0.5,
					y: 0.5,
					radius: 0.02,
					source: 'manual',
					status: 'approved',
					familyId: 33,
				},
			],
			families: [],
			currentFrameId: 300,
			currentFrameSideId: 700,
		})

		expect(occupied.has(33)).toBe(true)
	})
})
