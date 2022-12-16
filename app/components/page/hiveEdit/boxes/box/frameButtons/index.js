import React from 'react'

import { frameTypes } from '../../../../../../storage/frames'
import FramesIcon from '../../../../../../icons/framesIcon'
import {
	PopupButtonGroup,
	PopupButton,
} from '../../../../../shared/popupButton'
import Button from '../../../../../shared/button'
import DeleteIcon from '../../../../../../icons/deleteIcon'
import DownIcon from '../../../../../../icons/downIcon'

export default function FrameButtons({
	frameSelected,
	onFrameRemove,
	showDownButton,
	onMoveDown,
	onFrameAdd,
	onBoxRemove,
	box,
}) {
	return (
		<div style={{ display: 'flex' }}>
			<PopupButtonGroup style={`margin-right:3px`}>
				<Button
					onClick={() => {
						onFrameAdd(box.position, frameTypes.EMPTY_COMB)
					}}
				>
					<FramesIcon /> Add comb
				</Button>

				<PopupButton>
					<Button
						onClick={() => {
							onFrameAdd(box.position, frameTypes.VOID)
						}}
					>
						empty frame
					</Button>
					<Button
						onClick={() => {
							onFrameAdd(box.position, frameTypes.FOUNDATION)
						}}
					>
						foundation
					</Button>
					<Button
						onClick={() => {
							onFrameAdd(box.position, frameTypes.FEEDER)
						}}
					>
						feeder
					</Button>
					<Button
						onClick={() => {
							onFrameAdd(box.position, frameTypes.PARTITION)
						}}
					>
						partition
					</Button>

					<Button
						className="red"
						title="Delete frame"
						onClick={() => {
							onFrameRemove(box.position, frameSelected)
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
					onBoxRemove(box.position)
				}}
			>
				<DeleteIcon />
			</Button>
		</div>
	)
}
