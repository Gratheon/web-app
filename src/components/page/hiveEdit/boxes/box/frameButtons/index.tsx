import React from 'react'

import FramesIcon from '@/icons/framesIcon'
import DeleteIcon from '@/icons/deleteIcon'

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

	return (
		<PopupButtonGroup style={`margin-right:3px;flex-grow:1;`}>
			<Button
				onClick={() => {
					onFrameAdd(box.id, frameTypes.EMPTY_COMB)
				}}
			>
				<FramesIcon /><span>Add comb</span>
			</Button>

			<PopupButton>
				<Button
					onClick={() => {
						onFrameAdd(box.id, frameTypes.VOID)
					}}
				>
					empty frame
				</Button>
				<Button
					onClick={() => {
						onFrameAdd(box.id, frameTypes.FOUNDATION)
					}}
				>
					foundation
				</Button>
				<Button
					onClick={() => {
						onFrameAdd(box.id, frameTypes.FEEDER)
					}}
				>
					feeder
				</Button>
				<Button
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
