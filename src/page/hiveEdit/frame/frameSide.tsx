import React from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { gql, useMutation, useQuery } from '../../../api'
import { getFrameSide } from '../../../models/frameSide.ts'
import { getFrameSideFile, updateFrameSideFile } from '../../../models/frameSideFile.ts'
import { getFile } from '../../../models/files.ts'

import Loading from '../../../shared/loader'
import ErrorMessage from '../../../shared/messageError'

import UploadFile from './uploadFile'
import FRAME_SIDE_QUERY from './_api/getFrameFileObjectsQuery.graphql.ts'
import MessageNotFound from '../../../shared/messageNotFound'
import FrameSideDrawing from './frameSideDrawing.tsx'
import metrics from '../../../metrics.tsx'
import T from '../../../shared/translate'

export default function FrameSide({
	hiveId,
	frameId,
	frameSideId,
}) {

	if (!frameId || !frameSideId) {
		return
	}

	// Model function getFrameSide now handles invalid IDs
	let frameSide = useLiveQuery(() => getFrameSide(+frameSideId), [frameSideId], null);

	let frameSideFile = useLiveQuery(function () {
		if (!frameSide) return null

		return getFrameSideFile({
			frameSideId: frameSide.id,
		})
	}, [frameSide?.id], null);

	let file = useLiveQuery(function () {
		if (!frameSideFile?.fileId) return null

		return getFile(frameSideFile.fileId)
	}, [frameSideFile?.fileId], null);


	let { loading: loadingGet } = useQuery(
		FRAME_SIDE_QUERY,
		{ variables: { frameSideId } }
	)

	if (loadingGet) {
		return <Loading />
	}

	if (!frameSide) {
		return (<MessageNotFound msg={
			<T ctx="A frame is a small beehive wooden rectangular plank with beewax comb on it">Frame not found</T>
		}>
			<div>
				<T ctx="A frame is a small beehive wooden rectangular plank with beewax comb on it">
					Either frame was deleted, URL is invalid or there is some error on our side
				</T>
			</div>
		</MessageNotFound>)
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
			counts: [],
			detectedQueenCount: 0,
			detectedWorkerBeeCount: 0,
			detectedDroneCount: 0,
			varroaCount: 0
		});

		metrics.trackFramePhotoUploaded()
	}

	const error = <ErrorMessage error={errorFile || errorFrameSide} />

	if (!frameSideFile || !file) {
		return (
			<div style={{ flexGrow: 10, padding: 15 }}>
				{error}
				<UploadFile onUpload={onUpload} />
			</div>
		)
	}

	return <FrameSideDrawing
		file={file}
		frameSide={frameSide}
		frameSideFile={frameSideFile}
		frameId={frameId}
		frameSideId={frameSideId} />
}
