import React, { useState } from 'react'

import FramesIcon from '@/icons/framesIcon'

import Button from '@/components/shared/button'
import { useMutation } from '@/components/api'

import {
	countBoxFrames,
	frameTypes,
	addFrame,
} from '@/components/models/frames'
import FoundationIcon from '@/icons/foundationIcon'
import T from '@/components/shared/translate'
import metrics from '@/components/metrics'
import EmptyFrameIcon from '@/icons/emptyFrameIcon'
import FeederIcon from '@/icons/feederIcon'
import ButtonWithHover from '@/components/shared/buttonWithHover'

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
			<div style="display:flex">
				<ButtonWithHover
					loading={addingFrame}
					onClick={() => {
						onFrameAdd(box.id, frameTypes.EMPTY_COMB)
					}}
					title={<span><T ctx="this is a button that adds new frame into a beehive which has wax added by bees on it">Add comb</T></span>}
				>
					<FramesIcon />
				</ButtonWithHover>
			</div>

			<ButtonWithHover
				loading={addingFrame}
				onClick={() => {
					onFrameAdd(box.id, frameTypes.FOUNDATION)
				}}
				title={<span><T ctx="this is a button that adds new frame into a beehive which has a layer of wax added for bees to build cells upon">Add foundation</T></span>}
			><FoundationIcon /></ButtonWithHover>

			<ButtonWithHover
				loading={addingFrame}
				onClick={() => {
					onFrameAdd(box.id, frameTypes.VOID)
				}}
				title={<T ctx="this is a button that adds new frame into a beehive, but it has no cells or wax inside, only wooden frame">Add empty frame</T>}
			><EmptyFrameIcon /></ButtonWithHover>

			<ButtonWithHover
				loading={addingFrame}
				onClick={() => {
					onFrameAdd(box.id, frameTypes.FEEDER)
				}}
				title={<T ctx="this is a button that adds new vertical frame-like container into a beehive, for sugar syrup to be poured in, to feed the bees">Add vertical feeder</T>}
			><FeederIcon /></ButtonWithHover>

			<ButtonWithHover
				loading={addingFrame}
				onClick={() => {
					onFrameAdd(box.id, frameTypes.PARTITION)
				}}
				title={<T ctx="this is a button that adds new frame-like separator made of wood into a beehive to reduce available space for bees">Add partition</T>}
			>..</ButtonWithHover>

		</>
	)
}
