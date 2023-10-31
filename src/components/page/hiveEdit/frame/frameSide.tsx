import React from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { gql, useMutation, useQuery } from '@/components/api'
import { getFrameSide } from '@/components/models/frameSide'
import { getFrameSideFile, updateFrameSideFile } from '@/components/models/frameSideFile'
import { getFile } from '@/components/models/files'

import Loading from '@/components/shared/loader'
import ErrorMessage from '@/components/shared/messageError'

import UploadFile from './uploadFile'
import FRAME_SIDE_QUERY from './_api/getFrameFileObjectsQuery.graphql'
import MessageNotFound from '@/components/shared/messageNotFound'
import FrameSideDrawing from './frameSideDrawing'
import metrics from '@/components/metrics'

export default function FrameSide({
	hiveId,
	frameId,
	frameSideId,
	extraButtons,
}) {

	if (!frameId || !frameSideId) {
		return
	}

	let file, frameSideFile, frameSide

	frameSide = useLiveQuery(function () {
		return getFrameSide(+frameSideId)
	}, [frameSideId], null);

	frameSideFile = useLiveQuery(function () {
		if (!frameSide) return null

		return getFrameSideFile({
			frameSideId: frameSide.id,
		})
	}, [frameSide?.id], null);

	file = useLiveQuery(function () {
		if (!frameSideFile?.fileId) return null

		return getFile(frameSideFile.fileId)
	}, [frameSideFile?.fileId], null);


	let { loading: loadingGet, data } = useQuery(
		FRAME_SIDE_QUERY,
		{ variables: { frameSideId } }
	)

	let { loading: loadingGet2, data: hiveFrameSideCells } = useQuery(gql`
		query hiveFrameSideCells($frameSideId: ID!) {
			hiveFrameSideCells(frameSideId: $frameSideId) {
				__typename
				id
				broodPercent
				cappedBroodPercent
				eggsPercent
				pollenPercent
				honeyPercent
			}
		}`,
		{ variables: { frameSideId } }
	)

	if (loadingGet || loadingGet2) {
		return <Loading />
	}

	if (!frameSide) {
		return <MessageNotFound msg="Frame not found" />
	}

	let [frameSideMutate, { error: errorFrameSide }] = useMutation(
		gql`mutation updateFrameSide($cells: FrameSideCellsInput!) { 
			updateFrameSide(cells: $cells) 
		}`)

	let [linkFrameSideToFileMutation, { data: linkFrameSideToFileResult, error: errorFile }] = useMutation(
		gql`mutation addFileToFrameSide($frameSideID: ID!, $fileID: ID!, $hiveID: ID!) { 
			addFileToFrameSide(frameSideId: $frameSideID, fileId: $fileID, hiveId: $hiveID)
		}`
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
			detectedCells: [],
			detectedQueenCups: [],
			detectedVarroa: [],
			counts: []
		});

		metrics.trackFramePhotoUploaded()
	}

	const error = <ErrorMessage error={errorFile || errorFrameSide} />

	if (!frameSideFile || !file) {
		return (
			<div style={{ flexGrow: 10, padding: 15 }}>
				{error}
				{extraButtons}
				<UploadFile onUpload={onUpload} />
			</div>
		)
	}

	return <FrameSideDrawing
		extraButtons={extraButtons}
		file={file}
		frameSide={frameSide}
		frameSideFile={frameSideFile}
		frameId={frameId}
		frameSideId={frameSideId}/>
}