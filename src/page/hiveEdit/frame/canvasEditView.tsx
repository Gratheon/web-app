import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import Button from '@/shared/button'
import BreadCrumbs from '@/shared/breadcrumbs'
import T from '@/shared/translate'

import FrameSide from './frameSide'
import styles from './canvasEditView.module.less'

export default function CanvasEditView() {
	const navigate = useNavigate()
	const { apiaryId, hiveId, boxId, frameId, frameSideId } = useParams()

	if (!apiaryId || !hiveId || !boxId || !frameId || !frameSideId) {
		return null
	}

	return (
		<div className={styles.page}>
			<BreadCrumbs
				items={[
					{
						name: <><T>Apiary</T> #{apiaryId}</>,
						uri: `/apiaries/${apiaryId}`,
					},
					{
						name: <><T>Hive</T> #{hiveId}</>,
						uri: `/apiaries/${apiaryId}/hives/${hiveId}`,
					},
					{
						name: <><T>Frame</T> #{frameId}</>,
						uri: `/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}/frame/${frameId}/${frameSideId}`,
					},
					{
						name: <T>Edit canvas</T>,
						uri: `/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}/frame/${frameId}/${frameSideId}/canvas-edit`,
					},
				]}
			/>
			<div className={styles.topBar}>
				<h2 style={{ margin: 0 }}><T>Edit canvas</T></h2>
				<Button
					onClick={() =>
						navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}/frame/${frameId}/${frameSideId}`)
					}
				>
					<T>Back to hive view</T>
				</Button>
			</div>
			<div className={styles.canvasWrap}>
				<FrameSide
					hiveId={hiveId}
					frameId={frameId}
					frameSideId={frameSideId}
					allowDrawing={true}
				/>
			</div>
		</div>
	)
}
