import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import FramesIcon from '@/icons/framesIcon'
import DeleteIcon from '@/icons/deleteIcon'

import { PopupButtonGroup, PopupButton } from '@/components/shared/popupButton'
import Button from '@/components/shared/button'
import DownIcon from '@/icons/downIcon'
import UpIcon from '@/icons/upIcon'
import { useMutation } from '@/components/api'

import {
	removeBox,
	swapBoxPositions,
	getBoxAtPositionAbove,
	getBoxAtPositionBelow,
	getBox,
} from '@/components/models/boxes'

export default function BoxButtons({ box, onError, style = "display:flex;" }) {
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

	const [removingBox, setRemovingBox] = useState(false);
	async function onBoxRemove(id: number) {
		if (confirm('Are you sure?')) {
			setRemovingBox(true)
			const { error } = await removeBoxMutation({ id })

			if (error) {
				return onError(error)
			}

			await removeBox(id)
			setRemovingBox(false)
		}
	}

	return (
		<div style={style}>
			{showDownButton && (
				<Button
					loading={movingBox}
					title="Move down"
					onClick={() => {
						onMoveDown(+box.id)
					}}
				><DownIcon /></Button>
			)}

			{showUpButton && (
				<Button
					loading={movingBox}
					title="Move up"
					onClick={() => {
						onMoveUp(+box.id)
					}}
				><UpIcon /></Button>
			)}

			<Button
				color="red"
				title="Delete box"
				loading={removingBox}
				onClick={() => {
					onBoxRemove(+box.id)
				}}
			>
				<DeleteIcon />
			</Button>
		</div>
	)
}
