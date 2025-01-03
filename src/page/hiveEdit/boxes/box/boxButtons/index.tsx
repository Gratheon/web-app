import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import DownIcon from '@/icons/downIcon.tsx'
import UpIcon from '@/icons/upIcon.tsx'
import { useMutation } from '@/api'

import {
	removeBox,
	swapBoxPositions,
	getBoxAtPositionAbove,
	getBoxAtPositionBelow,
	getBox,
} from '@/models/boxes.ts'
import ButtonWithHover from '@/shared/buttonWithHover'
import T from '@/shared/translate'

export default function BoxButtons({ box, onError }) {
	let buttonDirections = useLiveQuery(async () => {
		return [
			await getBoxAtPositionBelow(box.hiveId, box.position) !== null,
			await getBoxAtPositionAbove(box.hiveId, box.position) !== null
		]
	}, [box]);

	if (!buttonDirections) {
		return null;
	}
	let [showDownButton, showUpButton] = buttonDirections;

	let [removeBoxMutation] = useMutation(`mutation deactivateBox($id: ID!) {
		deactivateBox(id: $id)
	}
	`)

	let [swapBoxPositionsMutation] = useMutation(
		`mutation swapBoxPositions($id: ID!, $id2: ID!) {swapBoxPositions(id: $id, id2: $id2)}`
	)

	const [movingBox, setMovingBox] = useState(false);
	async function onMoveDown(boxId: number) {
		setMovingBox(true);
		const box1 = await getBox(boxId)
		const box2 = await getBoxAtPositionBelow(box1.hiveId, box1.position)

		const { error } = await swapBoxPositionsMutation({
			id: box1.id,
			id2: box2.id,
		})

		if (error) {
			setMovingBox(false);
			return onError(error)
		}

		await swapBoxPositions(box1, box2)
		setMovingBox(false);
	}

	async function onMoveUp(boxId: number) {
		setMovingBox(true);
		const box1 = await getBox(boxId)
		const box2 = await getBoxAtPositionAbove(box1.hiveId, box1.position)

		const { error } = await swapBoxPositionsMutation({
			id: box1.id,
			id2: box2.id,
		})

		if (error) {
			setMovingBox(false);
			return onError(error)
		}

		await swapBoxPositions(box1, box2)
		setMovingBox(false);
	}

	return (
		<div>
			{showUpButton && (
				<ButtonWithHover
					loading={movingBox}
					onClick={() => {
						onMoveUp(+box.id)
					}}
					icon={<UpIcon />}
				><T>Move up</T></ButtonWithHover>
			)}

			{showDownButton && (
				<ButtonWithHover
					loading={movingBox}
					onClick={() => {
						onMoveDown(+box.id)
					}}
					icon={<DownIcon />}
				><T>Move down</T></ButtonWithHover>
			)}
		</div>
	)
}
