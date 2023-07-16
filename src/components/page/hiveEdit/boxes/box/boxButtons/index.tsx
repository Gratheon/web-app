import React from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import FramesIcon from '@/icons/framesIcon'
import DeleteIcon from '@/icons/deleteIcon'

import { PopupButtonGroup, PopupButton } from '@/components/shared/popupButton'
import Button from '@/components/shared/button'
import { useMutation } from '@/components/api'

import {
	removeBox,
	swapBoxPositions,
	getBoxAtPositionAbove,
	getBoxAtPositionBelow,
	getBox,
} from '@/components/models/boxes'

import {
	countBoxFrames,
	frameTypes,
	addFrame,
} from '@/components/models/frames'

export default function BoxButtons({ box, onError, style="display:flex;" }) {
	let buttonDirections = useLiveQuery(async() => {
		return [
			await getBoxAtPositionBelow(box.hiveId, box.position)!==null,
			await getBoxAtPositionAbove(box.hiveId, box.position)!==null
		]
	}, [box]);

	if(!buttonDirections){
		return null;
	}
	let [showDownButton, showUpButton] = buttonDirections;

	let [removeBoxMutation] = useMutation(`mutation deactivateBox($id: ID!) {
		deactivateBox(id: $id)
	}
	`)

	let [addFrameMutation] =
		useMutation(`mutation addFrame($boxId: ID!, $type: String!, $position: Int!) {
		addFrame(boxId: $boxId, type: $type, position: $position){
			id
			leftSide{
				id
			}
			rightSide{
				id
			}
		}
	}
	`)

	let [removeFrameMutation] = useMutation(`mutation deactivateFrame($id: ID!) {
		deactivateFrame(id: $id)
	}
	`)

	let [swapBoxPositionsMutation] = useMutation(
		`mutation swapBoxPositions($id: ID!, $id2: ID!) {swapBoxPositions(id: $id, id2: $id2)}`
	)

	async function onFrameAdd(boxId, type) {
		let position = (await countBoxFrames(boxId)) + 1
		const {
			data: {
				addFrame: { id, leftSide, rightSide },
			},
			error,
		} = await addFrameMutation({
			boxId,
			position,
			type,
		})

		if (error) {
			return onError(error)
		}

		await addFrame({
			id: +id,
			position,
			boxId,
			type,
			leftId: +leftSide?.id,
			rightId: +rightSide?.id,
		})
	}

	async function onMoveDown(boxId: number) {
		const box1 = await getBox(boxId)
		const box2 = await getBoxAtPositionBelow(box1.hiveId, box1.position)

		const { error } = await swapBoxPositionsMutation({
			id: box1.id,
			id2: box2.id,
		})

		if (error) {
			return onError(error)
		}

		await swapBoxPositions(box1, box2)
	}

	async function onMoveUp(boxId: number) {
		const box1 = await getBox(boxId)
		const box2 = await getBoxAtPositionAbove(box1.hiveId, box1.position)

		const { error } = await swapBoxPositionsMutation({
			id: box1.id,
			id2: box2.id,
		})

		if (error) {
			return onError(error)
		}

		await swapBoxPositions(box1, box2)
	}

	function onFrameRemove() {
		// removeFrameMutation
	}

	async function onBoxRemove(id: number) {
		const { error } = await removeBoxMutation({ id })

		if (error) {
			return onError(error)
		}

		await removeBox(id)
	}

	return (
		<div style={style}>
			{showDownButton && (
				<Button
					title="Move down"
					onClick={() => {
						onMoveDown(+box.id)
					}}
				>
					⬇️
				</Button>
			)}

			{showUpButton && (
				<Button
					title="Move up"
					onClick={() => {
						onMoveUp(+box.id)
					}}
				>
					⬆️
				</Button>
			)}

			<Button
				className="red"
				title="Delete box"
				onClick={() => {
					onBoxRemove(+box.id)
				}}
			>
				<DeleteIcon />
			</Button>
		</div>
	)
}
