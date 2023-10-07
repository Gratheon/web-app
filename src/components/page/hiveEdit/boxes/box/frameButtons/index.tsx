import React, { useState } from 'react'

import FramesIcon from '@/icons/framesIcon'

import { PopupButtonGroup, PopupButton } from '@/components/shared/popupButton'
import Button from '@/components/shared/button'
import { useMutation } from '@/components/api'

import {
	countBoxFrames,
	frameTypes,
	addFrame,
} from '@/components/models/frames'
import FoundationIcon from '@/icons/foundationIcon'
import T from '@/components/shared/translate'

export default function FrameButtons({ box, onError }) {
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

	const [addingFrame, setAdding] = useState(false)

	async function onFrameAdd(boxId, type) {
		setAdding(true)
		let position = (await countBoxFrames(boxId)) + 1
		const { data, error } = await addFrameMutation({ boxId, position, type })

		if (error) {
			return onError(error)
		}

		await addFrame({
			id: +data.addFrame.id,
			position,
			boxId,
			type,
			leftId: +data.addFrame.leftSide?.id,
			rightId: +data.addFrame.rightSide?.id,
		})
		setAdding(false)
	}

	return (
		<PopupButtonGroup style={`margin-right:3px;flex-grow:1;`}>
			<Button
				loading={addingFrame}
				onClick={() => {
					onFrameAdd(box.id, frameTypes.EMPTY_COMB)
				}}
			>
				<FramesIcon /><span><T ctx="this is a button that adds new frame into a beehive which has wax added by bees on it">Add comb</T></span>
			</Button>
			<Button
					loading={addingFrame}
					onClick={() => {
						onFrameAdd(box.id, frameTypes.FOUNDATION)
					}}
				>
					<FoundationIcon />
					<span><T ctx="this is a button that adds new frame into a beehive which has a layer of wax added for bees to build cells upon">Add foundation</T></span>
				</Button>

			<PopupButton>
				<Button
					loading={addingFrame}
					onClick={() => {
						onFrameAdd(box.id, frameTypes.VOID)
					}}
				>
					<T ctx="this is a button that adds new frame into a beehive, but it has no cells or wax inside, only wooden frame">Add empty frame</T>
				</Button>
				<Button
					loading={addingFrame}
					onClick={() => {
						onFrameAdd(box.id, frameTypes.FEEDER)
					}}
				><T ctx="this is a button that adds new vertical frame-like container into a beehive, for sugar syrup to be poured in, to feed the bees">Add feeder</T></Button>
				<Button
					loading={addingFrame}
					onClick={() => {
						onFrameAdd(box.id, frameTypes.PARTITION)
					}}
				><T ctx="this is a button that adds new frame-like separator made of wood into a beehive to reduce available space for bees">Add partition</T></Button>
			</PopupButton>
		</PopupButtonGroup>
	)
}
