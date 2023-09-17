import React, { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import debounce from 'lodash.debounce'

import { gql, useMutation, useQuery, useSubscription } from '@/components/api'
import {
	getFrameSide,
	toggleQueen,
	updateFrameStat,
} from '@/components/models/frameSide'
import { getFrameSideFile, updateFrameSideFile } from '@/components/models/frameSideFile'
import { getFile } from '@/components/models/files'
import { removeFrame } from '@/components/models/frames'

import Button from '@/components/shared/button'
import Loading from '@/components/shared/loader'
import CrownIcon from '@/icons/crownIcon'
import ErrorMessage from '@/components/shared/messageError'
import DeleteIcon from '@/icons/deleteIcon'

import styles from './styles.less'
import UploadFile from './uploadFile'
import DrawingCanvas from './drawingCanvas'
import MetricList from './metricList'
import LINK_FILE_TO_FRAME from './_api/addFileToFrameSideMutation.graphql'
import FRAME_SIDE_QUERY from './_api/getFrameFileObjectsQuery.graphql'

export default function Frame({
	apiaryId,
	hiveId,
	boxId,
	frameId,
	frameSideId,
}) {
	if (!frameId) {
		return null
	}

	let { loading: loadingGet, data: frameSideFileRelDetails } = useQuery(
		FRAME_SIDE_QUERY,
		{ variables: { frameSideId } }
	)

	if (loadingGet) {
		return <Loading />
	}

	let estimatedDetectionTimeSec = frameSideFileRelDetails?.hiveFrameSideFile?.estimatedDetectionTimeSec

	let frameWithFile = useLiveQuery(async function fetchFrameWithFile() {
		let r1 = await getFrameSide(+frameSideId)
		let r2 = r1?.id ? await getFrameSideFile({
			frameSideId: r1.id,
		}) : null;

		let r3 = await getFile(r2?.fileId ? r2?.fileId : -1)
		return { frameSide: r1, frameSideFile: r2, file: r3 }
	}, [frameSideId])

	if (!frameWithFile) {
		return <Loading />
	}
	let { frameSide, frameSideFile, file } = frameWithFile

	if (!frameSide) {
		return <Loading />
	}

	let [filesStrokeEditMutate, { error: errorStrokes }] = useMutation(gql`mutation filesStrokeEditMutation($files: [FilesUpdateInput]) { filesStrokeEditMutation(files: $files) }`)
	let [frameSideMutate, { error: errorFrameSide }] = useMutation(gql`mutation updateFrameSide($frameSide: FrameSideInput!) { updateFrameSide(frameSide: $frameSide) }`)
	let [linkFrameSideToFileMutation, { data: linkFrameSideToFileResult, error: errorFile }] = useMutation(
		gql`mutation addFileToFrameSide($frameSideID: ID!, $fileID: ID!, $hiveID: ID!) { 
			addFileToFrameSide(frameSideId: $frameSideID, fileId: $fileID, hiveId: $hiveID) {
				estimatedDetectionTimeSec
			}
		}`
	)

	useSubscription(gql`subscription onFrameSideBeesPartiallyDetected($frameSideId: String){
			onFrameSideBeesPartiallyDetected(frameSideId:$frameSideId){
				delta
			}
		}`, { frameSideId }, (_, response) => {
		if (response) {
			frameSideFile.detectedBees = [
				...frameSideFile.detectedBees,
				...response.onFrameSideBeesPartiallyDetected.delta
			]

			updateFrameSideFile(frameSideFile)
		}
	})
	useSubscription(gql`subscription onFrameSideBeesPartiallyDetected($frameSideId: String){
			onFrameSideResourcesDetected(frameSideId:$frameSideId){
				delta
			}
		}`, { frameSideId }, (_, response) => {
		if (response) {
			frameSideFile.detectedFrameResources = [
				...frameSideFile.detectedFrameResources,
				...response.onFrameSideResourcesDetected.delta
			]

			updateFrameSideFile(frameSideFile)
		}
	})

	if (!estimatedDetectionTimeSec) {
		estimatedDetectionTimeSec = linkFrameSideToFileResult?.addFileToFrameSide?.estimatedDetectionTimeSec
	}

	const onFrameSideStatChange = useMemo(
		() =>
			debounce(async function (key: string, percent: number) {
				let frameSide2 = await getFrameSide(+frameSideId)
				frameSide2 = await updateFrameStat(frameSide2, key, percent)

				await frameSideMutate({
					frameSide: {
						id: frameSide2.id,
						pollenPercent: frameSide2.pollenPercent,
						honeyPercent: frameSide2.honeyPercent,
						eggsPercent: frameSide2.eggsPercent,
						cappedBroodPercent: frameSide2.cappedBroodPercent,
						broodPercent: frameSide2.broodPercent,
						queenDetected: frameSide2.queenDetected,
					},
				})
			}, 300),
		[frameSideId]
	)

	async function onUpload(data) {
		if (!data) {
			return;
		}

		await linkFrameSideToFileMutation({
			frameSideID: frameSideId,
			fileID: data.id,
			hiveID: hiveId
		})

		await updateFrameSideFile({
			id: +frameSideId,
			fileId: +data.id,
			frameSideId: +frameSideId,
			strokeHistory: [],
			detectedBees: [],
			detectedFrameResources: [],
			counts: []
		});
	}

	async function onQueenToggle() {
		frameSide = await toggleQueen(frameSide)
		await frameSideMutate({
			frameSide: {
				id: frameSide.id,
				pollenPercent: frameSide.pollenPercent,
				honeyPercent: frameSide.honeyPercent,
				eggsPercent: frameSide.eggsPercent,
				cappedBroodPercent: frameSide.cappedBroodPercent,
				broodPercent: frameSide.broodPercent,
				queenDetected: frameSide.queenDetected,
			},
		})
	}

	async function onStrokeHistoryUpdate(strokeHistory) {
		filesStrokeEditMutate({
			files: [{
				frameSideId: frameSide.id,
				fileId: file.id,
				strokeHistory
			}]
		})

		frameSideFile.strokeHistory = strokeHistory;
		updateFrameSideFile(
			frameSideFile
		)
	}

	const navigate = useNavigate()
	function onFrameClose(event) {
		event.stopPropagation()
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`, {
			replace: true,
		})
	}

	let [removeFrameMutation, {error: errorFrameRemove}] = useMutation(`mutation deactivateFrame($id: ID!) {
		deactivateFrame(id: $id)
	}
	`)

	const extraButtons = (
		<div style={{ display: 'flex' }}>
			<Button onClick={onFrameClose}>Close</Button>
			<Button title="Toggle queen" onClick={onQueenToggle}>
				<CrownIcon fill={frameSide.queenDetected ? 'white' : '#555555'} />
				Toggle Queen
			</Button>

			<Button
				className="red"
				title="Remove frame"
				onClick={async () => {
					if (confirm('Are you sure?')) {
						await removeFrame(frameId, boxId)
						await removeFrameMutation({
							id: frameId
						})

						navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`, {
							replace: true,
						})
					}
				}}
			>
				<DeleteIcon />
				Remove frame
			</Button>
		</div>
	)

	const error = <ErrorMessage error={errorFile || errorFrameSide || errorStrokes || errorFrameRemove} />

	if (!frameSideFile || !file) {
		return (
			<div style={{ flexGrow: 10, padding: 15 }}>
				{error}
				{extraButtons}
				<UploadFile onUpload={onUpload} />
			</div>
		)
	}

	return (
		<div className={styles.frame}>
			<div className={styles.body}>
				{error}
				<DrawingCanvas
					imageUrl={file.url}
					detectedBees={frameSideFile.detectedBees}
					detectedFrameResources={frameSideFile.detectedFrameResources}
					strokeHistory={frameSideFile.strokeHistory}
					onStrokeHistoryUpdate={onStrokeHistoryUpdate}
				>
					<div style={{ display: 'flex', flexGrow: '1' }}>
						<MetricList
							onFrameSideStatChange={onFrameSideStatChange}
							estimatedDetectionTimeSec={estimatedDetectionTimeSec}
							frameSideFile={frameSideFile}
							frameSide={frameSide} />
					</div>
					{extraButtons}
				</DrawingCanvas>
			</div>
		</div>
	)
}