import React, { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'

import { useMutation } from '@/components/api'

import { getFrame, removeFrame } from '@/components/models/frames'
import T from '@/components/shared/translate'
import Button from '@/components/shared/button'
import Loading from '@/components/shared/loader'
import ErrorMessage from '@/components/shared/messageError'
import DeleteIcon from '@/components/icons/deleteIcon'

import styles from './styles.less'
import FrameSide from './frameSide'
import BoxFrame from '../boxes/box/boxFrame'

export default function Frame({
	apiaryId,
	hiveId,
	boxId,
	frameId,
	frameSideId,

	box,
	extraButtons
}) {

	if (!frameId) {
		return
	}

	let [frameRemoving, setFrameRemoving] = useState<boolean>(false)

	let frame = useLiveQuery(() => getFrame(+frameId), [frameId])

	if (frameRemoving) {
		return <Loading />
	}


	const navigate = useNavigate()

	let [removeFrameMutation, { error: errorFrameRemove }] = useMutation(`mutation deactivateFrame($id: ID!) {
		deactivateFrame(id: $id)
	}
	`)

	async function onFrameRemove() {
		if (confirm('Are you sure?')) {
			setFrameRemoving(true)
			await removeFrame(frameId, boxId)
			await removeFrameMutation({
				id: frameId
			})

			setFrameRemoving(false)
			navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`, {
				replace: true,
			})
		}
	}

	extraButtons = (
		<>
			{extraButtons}

			<Button
						color="red"
						title="Remove frame"
						onClick={onFrameRemove}
					>
						<DeleteIcon />
						<span><T>Remove frame</T></span>
					</Button>
		</>
	)

	const error = <ErrorMessage error={errorFrameRemove} />

	return (
		<div className={styles.frame}>
			<div className={styles.body}>
				{error}

				<div className={styles.frameHeader}>
					<h3>
						<T ctx="This is a heading for a beehive frame that shows image of bees, beecomb, cells">Selected frame</T>
					</h3>

					{frame && <BoxFrame
						box={box}
						frame={frame}
						apiaryId={apiaryId}
						hiveId={hiveId}
						frameId={frameId}
						frameSideId={frameSideId}
						editable={true}
						displayMode="list" />}

					<div style="flex-grow:1"></div>
					{extraButtons}
				</div>

				<FrameSide
					hiveId={hiveId}
					frameId={frameId}
					frameSideId={frameSideId} />
			</div>
		</div>
	)
}