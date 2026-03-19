import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import FramesIcon from '@/icons/framesIcon.tsx'

import { useMutation } from '@/api'

import {
	countBoxFrames,
	frameTypes,
	addFrame,
} from '@/models/frames.ts'
import { getHive } from '@/models/hive'
import FoundationIcon from '@/icons/foundationIcon.tsx'
import T, { useTranslation as t } from '@/shared/translate'
import metrics from '@/metrics.tsx'
import EmptyFrameIcon from '@/icons/emptyFrameIcon.tsx'
import Button from '@/shared/button'
import { PopupButton, PopupButtonGroup } from '@/shared/popupButton'
import { useWarehouseAutoAdjust } from '@/hooks/useWarehouseAutoAdjust'
import { addHiveLog, hiveLogActions } from '@/models/hiveLog'

export default function FrameButtons({ box, onError, hiveId }) {
	const tFrameAdded = t('Frame added')
	let [addFrameMutation] =
		useMutation(`mutation addFrame($boxId: ID!, $type: String!, $position: Int!) {
		addFrame(boxId: $boxId, type: $type, position: $position){
			id
			leftSide{
				id
				frameId
			}
			rightSide{
				id
				frameId
			}
		}
	}
	`)

	const [addingFrame, setAdding] = useState(false)
	const { decreaseWarehouseForFrame } = useWarehouseAutoAdjust()
	const hive = useLiveQuery(() => getHive(+hiveId), [hiveId], null)
	const frameCount = useLiveQuery(() => countBoxFrames(+box.id), [box.id], 0)
	const isNucleusHive = String(hive?.hiveType || '').toUpperCase() === 'NUCLEUS'
	const canAddFrame = !isNucleusHive || (Number(frameCount) || 0) < 5

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
		await addHiveLog({
			hiveId: +box.hiveId,
			action: hiveLogActions.STRUCTURE_ADD,
			title: tFrameAdded,
			details: `Added ${type} frame in section #${boxId} at position ${position}.`,
		})
		await decreaseWarehouseForFrame(boxId, type)

		metrics.trackFrameAdded()
		setAdding(false)
	}

	if (!canAddFrame) {
		return null
	}

	return (
			<PopupButtonGroup>
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
				</PopupButton>
			</PopupButtonGroup>
	)
}
