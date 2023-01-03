import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'
import { map, isNil } from 'lodash'

import { omitTypeName, useMutation, useQuery } from '../../api'
import Loader from '../../shared/loader'
import Boxes from './boxes'

import HIVE_QUERY from './_api/hiveQuery.graphql.js'
import HiveEditDetails from './editFormTop'
import HiveNavigationPanel from './breadcrumbs'
import HIVE_EDIT_MUTATION from './_api/hiveEditMutation.graphql.js'
import FILE_STROKE_EDIT_MUTATION from './_api/filesStrokeEditMutation.graphql.js'
import ErrorMsg from '../../shared/messageError'
import ErrorGeneral from '../../shared/messageErrorGlobal'
import OkMsg from '../../shared/messageSuccess'

import {
	addBox,
	getBoxes,
	setBoxes,
	removeBox,
	moveBoxDown,
} from '../../api/storage/boxes'
import { setFiles } from '../../api/storage/files'

import {
	setFrameSideProperty,
	moveFramesToBox,
	addFrame,
	getFrames,
	setFrames,
	swapBox,
	moveFrame,
	removeFrame,
	removeAllFromBox,
} from '../../api/storage/frames'

import { getFiles } from '../../api/storage/files'

import { setFrameSideFile } from '../../api/storage/files'
import { Box } from '../../api/schema'

export default function HiveEditForm() {
	let { apiaryId, hiveId, boxSelected, frameSelected, frameSide } = useParams()
	let navigate = useNavigate()
	let {
		loading: loadingGet,
		error: errorGet,
		data: hiveGet,
	} = useQuery(HIVE_QUERY, { variables: { id: hiveId } })

	let [updateHive, { loading: loadingUpdate, error, data }] =
		useMutation(HIVE_EDIT_MUTATION)
	let [updateFileStroke] = useMutation(FILE_STROKE_EDIT_MUTATION)
	const [loaded, setLoaded] = useState(false)
	const [hive, setHive] = useState(null)
	const [boxes, setBoxesCb] = useState(getBoxes({ hiveId }))
	const [frames, setFramesCb] = useState(getFrames({ hiveId }))

	if (!boxSelected) {
		boxSelected = '0'
	}

	function sync() {
		setFramesCb(getFrames({ hiveId }))
		setBoxesCb(getBoxes({ hiveId }))
	}

	// initial state setting
	if (!loaded && hiveGet) {
		setHive(hiveGet.hive)
		setFiles(hiveGet.hive.files, { hiveId })
		setBoxes(hiveGet.hive.boxes, { hiveId })
		setBoxesCb(getBoxes({ hiveId }))

		for (let boxIndex = 0; boxIndex < hiveGet.hive.boxes.length; boxIndex++) {
			const box = hiveGet.hive.boxes[boxIndex]
			setFrames(box.frames, { hiveId, boxIndex: box.position })
		}

		setFramesCb(getFrames({ hiveId }))
		setLoaded(true)
	}

	let errorMsg
	if (errorGet) {
		return <ErrorMsg error={errorGet} />
	} else if (error) {
		errorMsg = <ErrorMsg error={error} />
	}

	if (!hive || loadingGet || loadingUpdate) {
		return <Loader />
	}

	function onSubmit(e) {
		e.preventDefault()

		let tmpBoxes = getBoxes({ hiveId })

		tmpBoxes.forEach((v: Box) => {
			v.frames = getFrames({
				hiveId,
				boxIndex: v.position,
			})
		})

		updateHive({
			hive: {
				id: hiveId,
				boxes: omitTypeName(tmpBoxes),
				name: hive.name,
				notes: hive.notes,
				family: omitTypeName(hive.family),
			},
		})

		tmpBoxes.forEach((v: Box) => {
			delete v.frames
		})

		updateFileStroke({
			files: getFiles({ hiveId }).map((v) => {
				return {
					hiveId: v.hiveId,
					frameSideId: v.frameSideId,
					fileId: v.file?.id,
					strokeHistory: v.strokeHistory ? v.strokeHistory : [],
				}
			}),
		})

		return true
	}

	let okMsg

	if (data) {
		okMsg = <OkMsg />
	}

	function setName(name) {
		setHive({
			...hive,
			name,
		})
	}
	function onNotesChange(notes) {
		setHive({
			...hive,
			notes,
		})
	}

	function setRace(race) {
		let family = {
			race,
		}

		if (hive.family) {
			family = {
				...hive.family,
				...family,
			}
		}
		setHive({
			...hive,
			family,
		})
	}

	function setQueenYear(added) {
		let family = {
			added,
		}

		if (hive.family) {
			family = {
				...hive.family,
				added,
			}
		}
		setHive({
			...hive,
			family,
		})
	}

	// boxes
	function onBoxRemove(position) {
		removeAllFromBox({ hiveId: hive.id, boxIndex: position })

		const boxes = getBoxes({ hiveId: hive.id })

		removeBox({ hiveId: hive.id, position })

		map(boxes, (v: Box) => {
			if (v.position >= position) {
				moveFramesToBox({
					hiveId: hive.id,
					boxIndex: v.position + 1,
					toBoxIndex: v.position,
				})
			}
		})

		sync()
	}

	function onMoveDown(index) {
		if (moveBoxDown({ hiveId: hive.id, index })) {
			swapBox({
				hiveId: hive.id,
				boxIndex: index,
				toBoxIndex: index - 1,
			})
			sync()
		}
	}

	function onBoxAdd(boxType) {
		addBox({ hiveId: hive.id, boxType })
		sync()
	}

	// frames

	function onFrameAdd(boxIndex, frameType) {
		addFrame({
			hiveId: hive.id,
			boxIndex,
			frameType,
		})
		sync()
	}

	function onFrameRemove(boxIndex, framePosition) {
		removeFrame({
			hiveId: hive.id,
			boxIndex,
			framePosition,
		})
		sync()
	}

	function onDragDropFrame({
		removedIndex,
		addedIndex,
		boxIndex,
		apiaryId,
		hiveId,
		frameSide,
	}) {
		moveFrame({
			hiveId,
			removedIndex,
			addedIndex,
			boxIndex,
		})
		sync()

		//redirect
		if (!isNil(frameSide)) {
			// event.stopPropagation()
			navigate(
				`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxIndex}/frame/${addedIndex}/${frameSide}`,
				{ replace: true }
			)
		}
	}

	function onFrameClose(event) {
		event.stopPropagation()
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}`, { replace: true })
	}

	function onFrameSideStatChange(boxIndex, position, side, prop, value) {
		setFrameSideProperty({
			hiveId,
			boxIndex,
			position,
			side: side === 'left' ? 'leftSide' : 'rightSide',
			prop,
			value,
		})
		sync()
	}

	function onFrameSideFileUpload({ boxIndex, position, side, uploadedFile }) {
		setFrameSideFile({
			hiveId,
			boxIndex,
			position,
			side,
			uploadedFile,
		})
	}

	function onBoxClick({ event, boxIndex }) {
		// match only background div to consider it as a selection to avoid overriding redirect to frame click
		if (
			typeof event.target.className === 'string' &&
			event.target.className.indexOf('boxInner') === 0
		) {
			event.stopPropagation()
			navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxIndex}`, {
				replace: true,
			})
		}
	}

	return (
		<div>
			<HiveNavigationPanel
				items={[
					{
						name: 'apiary',
						uri: `/apiaries/edit/${apiaryId}`,
					},
					{
						name: hive.name,
						uri: `/apiaries/${apiaryId}/hives/${hive.id}`,
					},
				]}
			/>
			<ErrorGeneral />

			{errorMsg}
			{okMsg}

			<HiveEditDetails
				hive={hive}
				boxes={boxes}
				onSubmit={onSubmit}
				onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
					setName(e.target.value)
				}
				apiaryId={apiaryId}
				onNotesChange={(e: React.ChangeEvent<HTMLInputElement>) =>
					onNotesChange(e.target.value)
				}
				onRaceChange={(e: React.ChangeEvent<HTMLInputElement>) =>
					setRace(e.target.value)
				}
				onQueenYearChange={(e: React.ChangeEvent<HTMLInputElement>) =>
					setQueenYear(e.target.value)
				}
			/>

			<Boxes
				apiaryId={apiaryId}
				hiveId={hive.id}
				boxes={boxes}
				frames={frames}
				boxSelected={boxSelected}
				frameSelected={frameSelected}
				frameSide={frameSide}
				onDragDropFrame={onDragDropFrame}
				onMoveDown={onMoveDown}
				onBoxRemove={onBoxRemove}
				onBoxAdd={onBoxAdd}
				onBoxClick={onBoxClick}
				onFrameAdd={onFrameAdd}
				onFrameClose={onFrameClose}
				onFrameRemove={onFrameRemove}
				onFrameSideStatChange={onFrameSideStatChange}
				onFrameSideFileUpload={onFrameSideFileUpload}
			/>
		</div>
	)
}
