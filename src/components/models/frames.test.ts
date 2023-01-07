import {
	getFrames,
	moveFrame,
	removeAllFromBox,
	setFrames,
} from './frames'
import expect from 'expect'

// 2: [63 64 65]
// 1: [66]
const defaultFrameSet = [
	{
		boxIndex: 2,
		hiveId: 2,
		id: 63,
		position: 0,
		type: 'EMPTY_COMB',
		__typename: 'Frame',
	},
	{
		boxIndex: 2,
		hiveId: 2,
		id: 64,
		position: 1,
		type: 'EMPTY_COMB',
		__typename: 'Frame',
	},
	{
		boxIndex: 2,
		hiveId: 2,
		id: 65,
		position: 2,
		type: 'EMPTY_COMB',
		__typename: 'Frame',
	},
	{
		boxIndex: 1, // !
		hiveId: 2,
		id: 66,
		position: 0,
		type: 'EMPTY_COMB',
		__typename: 'Frame',
	},
]

it('removeAllFromBox', () => {
	// ARRANGE
	setFrames(defaultFrameSet, { hiveId: 2})
	// ACT
	removeAllFromBox({ hiveId: 2, boxIndex:0})
	// ASSERT
	expect(
		getFrames({
			boxIndex: 1,
			hiveId: 2,
		}).length
	).toEqual(1)
})

describe('moveFrame', () => {
	it('frame 63 >>', () => {
		// ARRANGE
		setFrames(defaultFrameSet, { hiveId: 2 })
		// ACT
		moveFrame({
			hiveId: 2,
			boxIndex: 2,
			removedIndex: 0,
			addedIndex: 1,
		})
		// ASSERT
		const result = getFrames({
			boxIndex: 2,
			hiveId: 2,
		})

		// reordered
		expect(result[0].id).toEqual(64)
		expect(result[1].id).toEqual(63)
		expect(result[2].id).toEqual(65)
	})

	it('frame 63 >> end', () => {
		// ARRANGE
		setFrames(defaultFrameSet, { hiveId: 2 ,})
		// ACT
		moveFrame({
			hiveId: 2,
			boxIndex: 2,
			removedIndex: 0,
			addedIndex: 2,
		})
		// ASSERT
		const result = getFrames({
			boxIndex: 2,
			hiveId: 2,
		})

		// reordered
		expect(result[0].id).toEqual(64)
		expect(result[1].id).toEqual(65)
		expect(result[2].id).toEqual(63)
	})

	it('frame 65 <<', () => {
		// ARRANGE
		setFrames(defaultFrameSet, { hiveId: 2})
		// ACT
		moveFrame({
			hiveId: 2,
			boxIndex: 2,
			removedIndex: 2,
			addedIndex: 1,
		})
		// ASSERT
		const result = getFrames({
			boxIndex: 2,
			hiveId: 2,
		})

		// reordered
		expect(result[0].id).toEqual(63)
		expect(result[1].id).toEqual(65)
		expect(result[2].id).toEqual(64)
	})

	it('frame 65 << beginning', () => {
		// ARRANGE
		setFrames(defaultFrameSet, { hiveId: 2})
		// ACT
		moveFrame({
			hiveId: 2,
			boxIndex: 2,
			removedIndex: 2,
			addedIndex: 0,
		})
		// ASSERT
		const result = getFrames({
			boxIndex: 2,
			hiveId: 2,
		})

		// reordered
		expect(result[0].id).toEqual(65)
		expect(result[1].id).toEqual(63)
		expect(result[2].id).toEqual(64)
	})
})
