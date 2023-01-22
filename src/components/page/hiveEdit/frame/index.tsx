import React, { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import debounce from 'lodash.debounce'

import colors from '@/components/colors'
import { useMutation, useQuery } from '@/components/api'
import {
	getFrameSide,
	toggleQueen,
	updateFrameStat,
} from '@/components/models/frameSide'
import Button from '@/components/shared/button'
import Loading from '@/components/shared/loader'
import CrownIcon from '@/icons/crownIcon'

import styles from './styles.less'
import UploadFile from './uploadFile'
import ResourceEditRow from './resourceEditRow'
import DrawingCanvas from './drawingCanvas'
import LINK_FILE_TO_FRAME from './_api/addFileToFrameSideMutation.graphql'
import FRAME_SIDE_QUERY from './_api/getFrameFileObjectsQuery.graphql'
import { getFrameSideFile, updateFrameSideFile } from '@/components/models/frameSideFile'
import { getFile } from '@/components/models/files'

export default function Frame({
	onError,
	apiaryId,
	hiveId,
	boxId,
	frameId,
	frameSideId,
}) {
	if (!frameId) {
		return null
	}
	let [expanded, expand] = useState(false)

	let { loading: loadingGet, data: frameSideFileRelDetails } = useQuery(
		FRAME_SIDE_QUERY,
		{ variables: { frameSideId } }
	)

	if (loadingGet) {
		return <Loading />
	}

	let frameWithFile = useLiveQuery(async function fetchFrameWithFile(){
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

	if(!frameSide){
		return <Loading />
	}

	let [filesStrokeEditMutate] = useMutation(`mutation filesStrokeEditMutation($files: [FilesUpdateInput]) { filesStrokeEditMutation(files: $files) }`)
	let [frameSideMutate] = useMutation(`mutation updateFrameSide($frameSide: FrameSideInput!) { updateFrameSide(frameSide: $frameSide) }`)
	let [linkFrameSideToFileMutation] = useMutation(`mutation addFileToFrameSide($frameSideID: ID!, $fileID: ID!, $hiveID: ID!) { addFileToFrameSide(frameSideId: $frameSideID, fileId: $fileID, hiveId: $hiveID) }`)

	const onFrameSideStatChange = useMemo(
		() =>
			debounce(async function (key: string, percent: number) {
				let frameSide2 = await getFrameSide(+frameSideId)
				frameSide2 = await updateFrameStat(frameSide2, key, percent)

				const { error } = await frameSideMutate({
					frameSide: {
						id: frameSide2.id,
						pollenPercent: frameSide2.pollenPercent,
						honeyPercent: frameSide2.honeyPercent,
						droneBroodPercent: frameSide2.droneBroodPercent,
						cappedBroodPercent: frameSide2.cappedBroodPercent,
						broodPercent: frameSide2.broodPercent,
						queenDetected: frameSide2.queenDetected,
					},
				})

				if (error) {
					onError(error)
				}
			}, 300),
		[frameSideId]
	)

	async function onUpload (data) {
		if(!data){
			return;
		}
		const { error } = await linkFrameSideToFileMutation({
			frameSideID: frameSideId,
			fileID: data.id,
			hiveID: hiveId
		})

		if (error) {
			onError(error)
		}

		await updateFrameSideFile({
			id: +frameSideId,
			fileId: +data.id,
			frameSideId: +frameSideId,
			strokeHistory: [],
			detectedObjects: [],
			counts: []
		});
	}

	async function onQueenToggle() {
		frameSide = await toggleQueen(frameSide)
		const { error } = await frameSideMutate({
			frameSide: {
				id: frameSide.id,
				pollenPercent: frameSide.pollenPercent,
				honeyPercent: frameSide.honeyPercent,
				droneBroodPercent: frameSide.droneBroodPercent,
				cappedBroodPercent: frameSide.cappedBroodPercent,
				broodPercent: frameSide.broodPercent,
				queenDetected: frameSide.queenDetected,
			},
		})

		if (error) {
			onError(error)
		}
	}

	async function onStrokeHistoryUpdate(strokeHistory) {
		let {error} = filesStrokeEditMutate({
			files: [{
				frameSideId: frameSide.id,
				fileId: file.id,
				strokeHistory
			}]
		})

		if (error) {
			onError(error)
		}

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

	const [linkFileToFrame] = useMutation(LINK_FILE_TO_FRAME)

	function onResize(key, value) {
		onFrameSideStatChange(key, Math.round(1 * value))
	}

	const extraButtons = (
		<div style={{ display: 'flex' }}>
			<Button onClick={onFrameClose}>Close</Button>
			<Button title="Toggle queen" onClick={onQueenToggle}>
				<CrownIcon fill={frameSide.queenDetected ? 'white' : '#555555'} />
				Toggle Queen
			</Button>
		</div>
	)

	if (!frameSideFile || !file) {
		return (
			<div style={{ flexGrow: 10, paddingLeft: 15 }}>
				{extraButtons}
				<UploadFile
					onError={onError}
					onUpload={onUpload}
				/>
			</div>
		)
	}

	return (
		<div className={styles.frame}>
			<div className={styles.body}>
				<DrawingCanvas
					imageUrl={file.url}
					detectedObjects={
						frameSideFile.detectedObjects ? frameSideFile?.detectedObjects : []
					}
					strokeHistory={frameSideFile.strokeHistory}
					onStrokeHistoryUpdate={onStrokeHistoryUpdate}
				>
					<div style={{ display: expanded ? 'block' : 'flex', flexGrow: '1' }}>
						<ResourceEditRow
							expanded={expanded}
							onClick={() => expand(!expanded)}
							title={'Brood'}
							color={colors.broodColor}
							percent={frameSide.broodPercent}
							onChange={(e) => onResize('broodPercent', e.target.value)}
						/>

						<ResourceEditRow
							expanded={expanded}
							onClick={() => expand(!expanded)}
							title={'Capped Brood'}
							color={colors.cappedBroodColor}
							percent={frameSide.cappedBroodPercent}
							onChange={(e) => onResize('cappedBroodPercent', e.target.value)}
						/>

						<ResourceEditRow
							expanded={expanded}
							onClick={() => expand(!expanded)}
							title={'Drone brood'}
							color={colors.droneBroodColor}
							percent={frameSide.droneBroodPercent}
							onChange={(e) => onResize('droneBroodPercent', e.target.value)}
						/>
						<ResourceEditRow
							expanded={expanded}
							onClick={() => expand(!expanded)}
							title={'Honey'}
							color={colors.honeyColor}
							percent={frameSide.honeyPercent}
							onChange={(e) => onResize('honeyPercent', e.target.value)}
						/>

						<ResourceEditRow
							expanded={expanded}
							onClick={() => expand(!expanded)}
							title={'Pollen'}
							color={colors.pollenColor}
							percent={frameSide.pollenPercent}
							onChange={(e) => onResize('pollenPercent', e.target.value)}
						/>

						{frameSideFile.counts.map((row)=>{
							return <div 
							title={beeTypeMap[row.type]} 
							style={{padding:'8px 5px'}}>🐝 {row.count}</div>
						})}
					</div>

					{extraButtons}
				</DrawingCanvas>
			</div>
		</div>
	)
}

const beeTypeMap = {
	'BEE_WORKER': 'Worker bees',
	'BEE_DRONE': 'Drones',
	'BEE_QUEEN': 'Queen',
}