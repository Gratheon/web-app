import React, { useState } from 'react'

import FramesIcon from '@/components/icons/framesIcon'

import { useMutation } from '@/components/api'

import {
	countBoxFrames,
	frameTypes,
	addFrame,
} from '@/components/models/frames'
import FoundationIcon from '@/components/icons/foundationIcon'
import T from '@/components/shared/translate'
import metrics from '@/components/metrics'
import EmptyFrameIcon from '@/components/icons/emptyFrameIcon'
import FeederIcon from '@/components/icons/feederIcon'
import PartitionIcon from '@/components/icons/partitionIcon'
import Button from '@/components/shared/button'
import { PopupButton, PopupButtonGroup } from '@/components/shared/popupButton'

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

		metrics.trackFrameAdded()
		setAdding(false)
	}

	return (
		<>

			<PopupButtonGroup style="justify-content:flex-end;">
				<Button
					loading={addingFrame}
					onClick={() => {
						onFrameAdd(box.id, frameTypes.EMPTY_COMB)
					}}
				>
					<FramesIcon />
					<T ctx="this is a button that adds new frame into a beehive which has wax added by bees on it">Add comb</T>
				</Button>
				<PopupButton align='right'>
					<Button
						loading={addingFrame}
						onClick={() => {
							onFrameAdd(box.id, frameTypes.FOUNDATION)
						}}
					><FoundationIcon /><T ctx="this is a button that adds new frame into a beehive which has a layer of wax added for bees to build cells upon">Add foundation</T></Button>
					<Button
						loading={addingFrame}
						onClick={() => {
							onFrameAdd(box.id, frameTypes.VOID)
						}}	
					><EmptyFrameIcon /><T ctx="this is a button that adds new frame into a beehive, but it has no cells or wax inside, only wooden frame">Add empty frame</T></Button>
					<Button
						loading={addingFrame}
						onClick={() => {
							onFrameAdd(box.id, frameTypes.FEEDER)
						}}
					><FeederIcon /><T ctx="this is a button that adds new vertical frame-like container into a beehive, for sugar syrup to be poured in, to feed the bees">Add vertical feeder</T></Button>
					<Button
						loading={addingFrame}
						onClick={() => {
							onFrameAdd(box.id, frameTypes.PARTITION)
						}}
					><PartitionIcon /><T ctx="this is a button that adds new frame-like separator made of wood into a beehive to reduce available space for bees">Add partition</T></Button>
				</PopupButton>
			</PopupButtonGroup>


		</>
	)
}
