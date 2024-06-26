import React from 'react'
import { useNavigate } from 'react-router-dom'

import styles from './index.less'
import FrameSide from './boxFrameHalf'
import { Box } from '@/components/models/boxes'
import { Frame } from '@/components/models/frames'
import { useLiveQuery } from 'dexie-react-hooks'

import { getFrameSideFile } from '@/components/models/frameSideFile'
import { File, getFile } from '@/components/models/files'

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
	editable,
	displayMode = 'visual',
}: BoxFrameProps) {
	const selectedFrame = frame.id === +frameId
	let navigate = useNavigate()

	let frameInternal = null
	const frameURL = `/apiaries/${apiaryId}/hives/${hiveId}/box/${box.id}/frame/${frame.id}`


	if (displayMode == 'list') {
		let leftFile: File = useLiveQuery(async function () {
			if(!frame.leftSide) {
				return null
			}
			let frameSideFile = await getFrameSideFile({
				frameSideId: frame.leftSide.id,
			})
			if (!frameSideFile) {
				return null
			}

			return getFile(frameSideFile.fileId)
		}, [frame], null);

		let rightFile: File = useLiveQuery(async function () {
			if(!frame.rightSide) {
				return null
			}
			let frameSideFile = await getFrameSideFile({
				frameSideId: frame.rightSide.id,
			})
			if (!frameSideFile) {
				return null
			}

			return getFile(frameSideFile.fileId)
		}, [frame], null);


		return  <div style="border:2px solid black; margin:2px; border-radius:3px;width:200px;">
					{leftFile && <img src={leftFile.resizes ? leftFile.resizes[0].url : leftFile.url} width={100} />}
					{rightFile && <img src={rightFile.resizes  ? rightFile.resizes[0].url : rightFile.url} width={100} />}
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
					className={frameSideId == frame.leftId ? `${styles.left} ${styles.sideSelected}` : styles.left}
					frameSide={frame.leftSide}
				/>

				<div className={styles.foundation} />

				<FrameSide
					className={frameSideId == frame.rightId ? `${styles.right} ${styles.sideSelected}` : styles.right}
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
