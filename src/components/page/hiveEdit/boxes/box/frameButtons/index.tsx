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
				<FramesIcon /><span>Add comb</span>
			</Button>

			<PopupButton>
				<Button
					loading={addingFrame}
					onClick={() => {
						onFrameAdd(box.id, frameTypes.VOID)
					}}
				>
					empty frame
				</Button>
				<Button
					loading={addingFrame}
					onClick={() => {
						onFrameAdd(box.id, frameTypes.FOUNDATION)
					}}
				>
					foundation
				</Button>
				<Button
					loading={addingFrame}
					onClick={() => {
						onFrameAdd(box.id, frameTypes.FEEDER)
					}}
				>
					feeder
				</Button>
				<Button
					loading={addingFrame}
					onClick={() => {
						onFrameAdd(box.id, frameTypes.PARTITION)
					}}
				>
					partition
				</Button>
			</PopupButton>
		</PopupButtonGroup>
	)
}
