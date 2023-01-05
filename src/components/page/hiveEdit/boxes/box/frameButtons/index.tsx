import React from 'react'

import { frameTypes } from '../../../../../models/frames'
import FramesIcon from '../../../../../../icons/framesIcon'
import {
	PopupButtonGroup,
	PopupButton,
} from '../../../../../shared/popupButton'
import Button from '../../../../../shared/button'
import DeleteIcon from '../../../../../../icons/deleteIcon'
import DownIcon from '../../../../../../icons/downIcon'
import { useMutation } from '../../../../../api'

import { removeBox } from '../../../../../models/boxes'
import { countBoxFrames } from '../../../../../models/frames'

export default function FrameButtons({ frameId, showDownButton, box, onError }) {
	let [removeBoxMutation] = useMutation(`mutation deactivateBox($id: ID!) {
		deactivateBox(id: $id)
	}
	`)

	let [addFrameMutation] =
		useMutation(`mutation addFrame($boxId: ID!, $type: String!, $position: Int!) {
		addFrame(boxId: $boxId, type: $type, position: $position){
			id
		}
	}
	`)

	let [removeFrameMutation] = useMutation(`mutation deactivateBox($id: ID!) {
		deactivateBox(id: $id)
	}
	`)
	//todo
	async function onFrameAdd(boxId, type) {
		let position = (await countBoxFrames(boxId)) + 1
		const {data,error} = await addFrameMutation({
			boxId,
			position,
			type
		});

		if(error){
			onError(error);
		}
	}

	function onMoveDown(position) {}
	function onFrameRemove() {}

	async function onBoxRemove(id: number) {
		const result = await removeBoxMutation({ id })
		await removeBox(id)
	}

	return (
		<div style={{ display: 'flex' }}>
			<PopupButtonGroup style={`margin-right:3px`}>
				<Button
					onClick={() => {
						onFrameAdd(box.id, frameTypes.EMPTY_COMB)
					}}
				>
					<FramesIcon /> Add comb
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

					<Button
						className="red"
						title="Delete frame"
						onClick={() => {
							onFrameRemove(box.id, frameId)
						}}
					>
						<DeleteIcon />
						Delete frame
					</Button>
				</PopupButton>
			</PopupButtonGroup>

			<Button
				title="Move down"
				onClick={() => {
					if (showDownButton) {
						onMoveDown(box.position)
					}
				}}
			>
				<DownIcon />
			</Button>

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
