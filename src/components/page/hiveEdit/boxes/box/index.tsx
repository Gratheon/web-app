import React from 'react'
import isNil from 'lodash/isNil'
import { Container, Draggable } from '@edorivai/react-smooth-dnd'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from "dexie-react-hooks";

import { useMutation, useQuery } from '@/components/api'
import { getFrame, getFrames, moveFrame } from '@/components/models/frames'
import CrownIcon from '@/icons/crownIcon'
import { isFrameWithSides } from '@/components/models/frames'
import ErrorMessage from '@/components/shared/messageError'
import Loader from '@/components/shared/loader'

import styles from './index.less'
import Frame from './boxFrame'
import FRAMES_QUERY from './framesQuery.graphql'

export default ({
	box,
	boxId,
	frameId,
	frameSideId,
	apiaryId,
	hiveId,
}) => {
	const navigate = useNavigate();
	const framesDiv = []

	const frames = useLiveQuery(() => getFrames({
		boxId: +box.id
	}), [boxId, box], false);

	if (frames === false) {
		return <Loader />
	}

	if (frames?.length == 0) {
		let { loading } = useQuery(FRAMES_QUERY, { variables: { id: +hiveId, apiaryId: +apiaryId } })

		if (loading) {
			return <Loader />
		}
	}

	let [updateFramesRemote, { error }] = useMutation(`mutation updateFrames($frames: [FrameInput]!) { updateFrames(frames: $frames) { id } }`)

	async function swapFrames({ removedIndex, addedIndex }) {
		await moveFrame({
			boxId,
			addedIndex,
			removedIndex
		})

		const frames = await getFrames({ boxId: +boxId })
		await updateFramesRemote({frames: frames.map((v)=>{
			let r = {
				...v
			}
			delete r.rightId
			delete r.leftId
			delete r.leftSide
			delete r.rightSide
			return r
		})})

		if (!isNil(frameSideId)) {
			navigate(
				`/apiaries/${apiaryId}/hives/${hiveId}/box/${box.id}/frame/${frameId}/${frameSideId}`,
				{ replace: true }
			)
		}
	}

	if (!isNil(frames)) {
		for (let i = 0; i < frames.length; i++) {
			const frame = frames[i]

			framesDiv.push(
				</* @ts-ignore */ Draggable key={i}>
					<div style={{ textAlign: 'center', height: 20 }}>
						{isFrameWithSides(frame.type) && (
							<CrownIcon
								fill={frame.leftSide?.queenDetected ? 'white' : '#444444'}
							/>
						)}
						{isFrameWithSides(frame.type) && (
							<CrownIcon
								fill={frame.rightSide?.queenDetected ? 'white' : '#444444'}
							/>
						)}
					</div>

					<Frame
						box={box}
						boxId={boxId}
						frameId={frameId}
						frameSideId={frameSideId}

						hiveId={hiveId}
						apiaryId={apiaryId}
						frame={frame}
					/>
				</Draggable>
			)
		}
	}

	return (
		<div>
			<ErrorMessage error={error} />

			<div
				className={`${styles['boxType_' + box.type]} ${styles.boxOuter} ${+boxId === box.id && styles.selected
					}`}
			>
				<div className={styles.boxInner}>
					{!frames && <Loader small={true} />}

					{/* @ts-ignore */}
					<Container
						style={{ height: `calc(100% - 30px)` }}
						onDrop={swapFrames}
						orientation="horizontal"
					>
						{framesDiv}
					</Container>
				</div>
			</div>
		</div>
	)
}
