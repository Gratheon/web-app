import React from 'react'
import isNil from 'lodash/isNil'
import { Container, Draggable } from '@edorivai/react-smooth-dnd'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from "dexie-react-hooks";

import { gql, useMutation, useQuery } from '@/components/api'
import { getFrames, moveFrame } from '@/components/models/frames'
import ErrorMessage from '@/components/shared/messageError'
import Loader from '@/components/shared/loader'

import styles from './index.less'
import Frame from './boxFrame'
import FRAMES_QUERY from './framesQuery.graphql'
import { getFrameSideCells } from '@/components/models/frameSideCells';

export default function Box({
	box,
	boxId,
	frameId,
	frameSideId,
	apiaryId,
	hiveId,
}) {
	const navigate = useNavigate();
	const framesDiv = []

	const [updateFramesRemote, {error}] = useMutation(gql`mutation updateFrames($frames: [FrameInput]!) { updateFrames(frames: $frames) { id } }`)

	const frames = useLiveQuery(async() => {
		let tmp = await getFrames({
			boxId: +box.id
		})

		for (const r in tmp) {
			if(!tmp[r].leftSide){
				tmp[r].leftSide = {}
			}

			if(!tmp[r].rightSide){
				tmp[r].rightSide = {}
			}

			tmp[r].leftSide.cells = await getFrameSideCells(tmp[r].leftId)
			tmp[r].rightSide.cells = await getFrameSideCells(tmp[r].rightId)
		}

		return tmp
	}, [boxId, box], false);

	if (frames === false) {
		return <Loader />
	}

	let { loading, data } = useQuery(FRAMES_QUERY, { variables: { id: +hiveId, apiaryId: +apiaryId } })

	if (loading) {
		return <Loader />
	}

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

	if (frames && frames.length > 0) {
		for (let i = 0; i < frames.length; i++) {
			const frame = frames[i]

			framesDiv.push(
				</* @ts-ignore */ Draggable key={i}>
					<Frame
						box={box}
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
					{!frames && <Loader size={1} />}

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
