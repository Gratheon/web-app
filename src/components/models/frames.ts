import { Frame } from '@/components/api/schema'

import { db } from './db'

let frames = [] //db.get('frames')
export const frameTypes = {
	VOID: 'VOID',
	FOUNDATION: 'FOUNDATION',
	EMPTY_COMB: 'EMPTY_COMB',
	FEEDER: 'FEEDER',
	PARTITION: 'PARTITION',
}

export async function getFrame(id: number): Promise<Frame> {
	if (!id) {
		return null;
	}

	try {
		return await db['frame'].get({ id })
	} catch (e) {
		console.error(e, { id });
	}
}

export async function getFrames(where = {}): Promise<Frame[]|null> {
	if (!where) return []
	try {
		const frames = await db['frame'].where(where).sortBy('position')

		for await (let frame of frames) {
			if (frame.leftId) {
				frame.leftSide = await db['frameside'].get(frame.leftId)
			}
			if (frame.rightId) {
				frame.rightSide = await db['frameside'].get(frame.rightId)
			}
		}
		return frames
	} catch (e) {
		console.error(e)
		return null
	}
}

export async function countBoxFrames(boxId): Promise<number> {
	try {
		return await db['frame'].where({ boxId }).count()
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function addFrame(frameData) {
	try {
		const { id, position, boxId, type, leftId, rightId } = frameData;

		if (leftId) {
			await db['frameside'].put({
				id: leftId,
			})
		}

		if (rightId) {
			await db['frameside'].put({
				id: rightId,
			})
		}
		await db['frame'].put({
			id,
			position,
			boxId,
			type,
			leftId,
			rightId,
		})
	} catch (e) {
		console.error(e)
		throw e
	}
}

export async function moveFrame({
	boxId,
	removedIndex,
	addedIndex,
}: {
	removedIndex: number;
	addedIndex?: number;
	boxId: number;
}) {
	removedIndex++

	if (addedIndex !== null) {
		addedIndex++
	}

	let tmpFrames = await getFrames({ boxId: +boxId });

	// remove frame
	tmpFrames.forEach((v) => {
		if (v.position === removedIndex) {
			v.position = -1;
		}
	});

	// update other frame positions
	let i = 1;
	tmpFrames.forEach((v) => {
		if(i == addedIndex){
			i++ 
		}
		if (v.position !== -1) {
			v.position = i;
			i++
		}
	});

	// add frame back
	if (addedIndex !== null) {
		tmpFrames.forEach((v) => {
			if (v.position === -1) {
				v.position = addedIndex;
			}
		});
	}

	// Update all frames in parallel
	const updatePromises = tmpFrames.map((v) => updateFrame(v));
	await Promise.all(updatePromises);
}

export async function updateFrame(data: Frame) {
	try {
		return await db['frame'].put(data)
	} catch (e) {
		console.error(e)
		throw e
	}
}


export async function removeFrame(frameId, boxId) {
	try {
		let frame = await getFrame(+frameId)

		await db['frame'].delete(+frameId)

		// shift positions of other frames
		await moveFrame({ boxId: +boxId, removedIndex: frame.position })
	} catch (e) {
		console.error(e)
		throw e
	}

}

export function isFrameWithSides(frameType) {
	return (
		frameType === frameTypes.EMPTY_COMB ||
		frameType === frameTypes.FOUNDATION ||
		frameType === frameTypes.VOID
	)
}
