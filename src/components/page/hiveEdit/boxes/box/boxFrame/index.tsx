import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { Box } from '@/components/models/boxes'
import { Frame } from '@/components/models/frames'
import { getFrameSideFile } from '@/components/models/frameSideFile'
import { File, getFile } from '@/components/models/files'

import styles from './index.less'
import FrameSide from './boxFrameHalf'
import { enrichFramesWithSides } from '@/components/models/frameSide'

type BoxFrameProps = {
	box: Box
	apiaryId: number
	hiveId: number
	frameId: number
	frameSideId: number
	frame: Frame

	editable: Boolean
	displayMode: string
}

export default function BoxFrame({
	box,
	apiaryId,
	hiveId,
	frameId,
	frameSideId,
	frame,
	editable = true,
	displayMode = 'visual',
}: BoxFrameProps) {
	const frameWithSides = useLiveQuery(async () => {
		let tmp = await enrichFramesWithSides([frame]);
		return tmp[0]
	}, [frameId]);

	if (!frameWithSides) return null


	const selectedFrame = frame.id === +frameId
	let navigate = useNavigate()

	let frameInternal = null
	const frameURL = `/apiaries/${apiaryId}/hives/${hiveId}/box/${box.id}/frame/${frame.id}`


	// const framesWithoutCells = await enrichFramesWithSides(framesWithoutSides);
	let leftFile: File = useLiveQuery(async function () {
		if (!frameWithSides.leftSide) {
			return null
		}
		let frameSideFile = await getFrameSideFile({
			frameSideId: frameWithSides.leftSide.id,
		})
		if (!frameSideFile) {
			return null
		}

		return getFile(frameSideFile.fileId)
	}, [frame], null);

	let rightFile: File = useLiveQuery(async function () {
		if (!frameWithSides.rightSide) {
			return null
		}
		let frameSideFile = await getFrameSideFile({
			frameSideId: frameWithSides.rightSide.id,
		})
		if (!frameSideFile) {
			return null
		}

		return getFile(frameSideFile.fileId)
	}, [frame], null);

	if (displayMode == 'list') {
		return <div className={styles.listFrameIcon}>
			<div className={+frameSideId == +frame.leftId ? `${styles.listFrameIconSelected}` : ''}
				onClick={() => {
					if (editable) {
						navigate(`${frameURL}/${frame.leftId}`, { replace: true })
					}
				}}>
				{leftFile && <img src={leftFile.resizes && leftFile.resizes.length > 0 ? leftFile.resizes[0].url : leftFile.url} />}
			</div>
			<div
				className={+frameSideId == +frame.rightId ? `${styles.listFrameIconSelected}` : ''}
				onClick={() => {
					if (editable) {
						navigate(`${frameURL}/${frame.rightId}`, { replace: true })
					}
				}}>
				{rightFile && <img src={rightFile.resizes && rightFile.resizes.length > 0 ? rightFile.resizes[0].url : rightFile.url} />}
			</div>
		</div>
	}

	if (frame.type === 'VOID') {
		frameInternal = <div onClick={() => {
			if (editable) { navigate(frameURL, { replace: true }) }
		}} className={styles.voidFrame} />
	} else if (frame.type === 'PARTITION') {
		frameInternal = <div onClick={() => {
			if (editable) { navigate(frameURL, { replace: true }) }
		}} className={styles.partition} />
	} else if (frame.type === 'FEEDER') {
		frameInternal = <div onClick={() => {
			if (editable) { navigate(frameURL, { replace: true }) }
		}} className={styles.feeder} />
	} else if (frame.type === 'FOUNDATION') {
		frameInternal = (
			<div className={styles.foundationFrame} onClick={() => {
				if (editable) { navigate(frameURL, { replace: true }) }
			}}>
				<div style={{ flexGrow: 1 }} />
				<div className={styles.foundation} />
				<div style={{ flexGrow: 1 }} />
			</div>
		)
	} else if (frame.type === 'EMPTY_COMB') {
		frameInternal = (
			<div className={styles.emptyComb}>
				<FrameSide
					onFrameSideClick={() => {
						if (editable) {
							navigate(`${frameURL}/${frame.leftId}`, { replace: true })
						}
					}}
					className={styles.left}
					frameSide={frame.leftSide}
				/>

				<div className={styles.foundation} />

				<FrameSide
					className={styles.right}
					onFrameSideClick={() => {
						if (editable) {
							navigate(`${frameURL}/${frame.rightId}`, { replace: true })
						}
					}}
					frameSide={frame.rightSide}
				/>
			</div>
		)
	}

	return (
		<div className={`${styles.frame} ${selectedFrame && styles.frameSelected}`}>
			{frameInternal}
		</div>
	)
}
