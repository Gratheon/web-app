import expect from 'expect'
import { moveBoxDown, setBoxes, getBoxes, removeBox } from './boxes'

describe('moveBoxDown', () => {
	it('should not move position with 0 higher', () => {
		setBoxes([
			{
				hiveId: 1,
				id: 11,
				position: 0,
				type: 'DEEP',
				__typename: 'Box',
			},
		])
		moveBoxDown({
			hiveId: 1,
			index: 0,
		})

		expect(
			getBoxes({
				hiveId: 1,
			})[0].position
		).toEqual(0)
	})

	it('should not move position with 0 higher', () => {
		setBoxes([
			{
				hiveId: 1,
				id: 11,
				position: 1,
				type: 'DEEP',
				__typename: 'Box',
			},
			{
				hiveId: 1,
				id: 12,
				position: 0,
				type: 'DEEP',
				__typename: 'Box',
			},
		])
		moveBoxDown({
			hiveId: 1,
			index: 1,
		})

		expect(
			getBoxes({
				hiveId: 1,
			})[0].id
		).toEqual(12)
	})
})

describe('moveBoxDown', () => {
	it('should not move position with 0 higher', () => {
		setBoxes([
			{
				hiveId: 1,
				id: 11,
				position: 1,
				type: 'DEEP',
				__typename: 'Box',
			},
			{
				hiveId: 1,
				id: 12,
				position: 0,
				type: 'DEEP',
				__typename: 'Box',
			},
		])
		removeBox({
			hiveId: 1,
			position: 0,
		})

		const boxes = getBoxes({
			hiveId: 1,
		})

		expect(boxes.length).toEqual(1)

		expect(boxes[0].position).toEqual(0)
	})
})
