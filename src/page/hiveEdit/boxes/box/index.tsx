import isNil from 'lodash/isNil'
import { Container, Draggable } from '@edorivai/react-smooth-dnd'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useMutation, useQuery, useSubscription } from '@/api'
import ErrorMessage from '@/shared/messageError'
import Loader from '@/shared/loader'

import { Frame as FrameType, getFrames, moveFrame } from '@/models/frames'
import { enrichFramesWithSides } from '@/models/frameSide'
import {
	enrichFramesWithSideCells,
	getFrameSideCells,
	newFrameSideCells,
	updateFrameSideCells,
} from '@/models/frameSideCells'

import styles from './index.module.less'
import Frame from './boxFrame'
import FRAMES_QUERY from './framesQuery.graphql.ts'

type BoxType = {
	box: any
	boxId: number
	frameId: number
	frameSideId: number
	apiaryId: number
	hiveId: number
	editable?: boolean
	selected?: boolean
	displayMode: string
	// Add new props
	frameSidesData?: any[] // Make optional for cases where it's not passed
	onFrameImageClick?: (imageUrl: string) => void // Make optional
}

export default function Box({
	box,
	boxId,
	frameId,
	frameSideId,
	apiaryId,
	hiveId,
	editable = true,
	selected = false,
	displayMode,
	// Destructure new props with defaults
	frameSidesData = [],
	onFrameImageClick = (imageUrl: string) => {},
}: BoxType): any {
	const navigate = useNavigate()
	let framesDiv = []

	useSubscription(
		gql`
			subscription onHiveFrameSideCellsDetected($hiveId: String) {
				onHiveFrameSideCellsDetected(hiveId: $hiveId) {
					delta
					isCellsDetectionComplete

					frameSideId
					broodPercent
					cappedBroodPercent
					eggsPercent
					pollenPercent
					honeyPercent
				}
			}
		`,
		{ hiveId },
		async (_, response) => {
			if (response) {
				let updatedFrameSideId =
					+response.onHiveFrameSideCellsDetected.frameSideId
				let frameSideFile =
					(await getFrameSideCells(updatedFrameSideId)) ||
					newFrameSideCells(updatedFrameSideId, hiveId)

				frameSideFile.broodPercent =
					response.onHiveFrameSideCellsDetected.broodPercent
				frameSideFile.cappedBroodPercent =
					response.onHiveFrameSideCellsDetected.cappedBroodPercent
				frameSideFile.eggsPercent =
					response.onHiveFrameSideCellsDetected.eggsPercent
				frameSideFile.pollenPercent =
					response.onHiveFrameSideCellsDetected.pollenPercent
				frameSideFile.honeyPercent =
					response.onHiveFrameSideCellsDetected.honeyPercent

				await updateFrameSideCells(frameSideFile)
			}
		}
	)

	const frames = useLiveQuery(
		async () => {
			const framesWithoutSides = await getFrames({ boxId: box.id })
			const framesWithoutCells = await enrichFramesWithSides(framesWithoutSides)
			return await enrichFramesWithSideCells(framesWithoutCells)
		},
		[box.id],
		false
	)

	if (frames === false) {
		return <Loader />
	}

	const [updateFramesRemote, { error }] = useMutation(
		gql`
			mutation updateFrames($frames: [FrameInput]!) {
				updateFrames(frames: $frames) {
					id
				}
			}
		`
	)
	let { loading } = useQuery(FRAMES_QUERY, {
		variables: {
			id: +hiveId,
			apiaryId: +apiaryId,
		},
	})

	if (loading) {
		return <Loader />
	}

	if (frames && frames.length > 0) {
		for (let i = 0; i < frames.length; i++) {
			const frame = frames[i]

			let frameDiv = (
				<Frame
					box={box}
					frameId={frameId}
					frameSideId={frameSideId}
					hiveId={hiveId}
					apiaryId={apiaryId}
					frame={frame}
					editable={editable}
					displayMode={displayMode}
					// Pass props down to Frame
					frameSidesData={frameSidesData}
					onFrameImageClick={onFrameImageClick}
				/>
			)

			if (editable && displayMode == 'list') {
				framesDiv.push(
					</* @ts-ignore */ Draggable key={i}>{frameDiv}</Draggable>
				)
			} else {
				framesDiv.push(frameDiv)
			}
		}
	}

	let framesWrapped: any = framesDiv

	if (editable) {
		async function swapFrames({ removedIndex, addedIndex }) {
			await moveFrame({
				boxId,
				addedIndex,
				removedIndex,
			})

			const frames = await getFrames({ boxId: +boxId })
			await updateFramesRemote({
				frames: frames.map((v: FrameType) => {
					let r = {
						...v,
					}
					delete r.rightId
					delete r.leftId
					delete r.leftSide
					delete r.rightSide
					delete r.__typename
					return r
				}),
			})

			if (!isNil(frameSideId)) {
				navigate(
					`/apiaries/${apiaryId}/hives/${hiveId}/box/${box.id}/frame/${frameId}/${frameSideId}`,
					{ replace: true }
				)
			}
		}

		framesWrapped = (
			<>
				{/* @ts-ignore */}
				<Container
					style={{ height: `calc(100% - 10px)` }}
					onDrop={swapFrames}
					orientation="horizontal"
				>
					{framesDiv}
				</Container>
			</>
		)
	}

	// visually limit the width of the box to 12 frames
	let maxWidthStyle ={}
	if(frames.length> 10){
		maxWidthStyle = {
			maxWidth: 32 * 12 + 10
		}
	}


	if (displayMode == 'visual') {
		return (
			<>
				<ErrorMessage error={error} />
				<div 
					className={`${styles.boxOuter} ${selected && styles.selected}`}
					style={maxWidthStyle}>
					<div className={styles.boxInnerVisual}>
						{!frames && <Loader size={1} />}
						{framesDiv}
					</div>
				</div>
			</>
		)
	}

	return (
		<>
			<ErrorMessage error={error} />
			<div
				className={`${styles['boxType_' + box.type]} ${styles.boxOuter} ${
					selected && styles.selected
				}`}
				style={maxWidthStyle}
			>
				<div className={styles.boxInner}>
					{!frames && <Loader size={1} />}
					{framesWrapped}
				</div>
			</div>
		</>
	)
}
