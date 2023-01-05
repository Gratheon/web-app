import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'
import { map, isNil } from 'lodash'
import { useLiveQuery } from "dexie-react-hooks";

import { omitTypeName, useMutation, useQuery } from '../../api'
import Loader from '../../shared/loader'
import Boxes from './boxes'

import HIVE_QUERY from './_api/hiveQuery.graphql'
import HiveEditDetails from './editFormTop'
import HiveNavigationPanel from './breadcrumbs'
import HIVE_EDIT_MUTATION from './_api/hiveEditMutation.graphql'
import FILE_STROKE_EDIT_MUTATION from './_api/filesStrokeEditMutation.graphql'
import ErrorMsg from '../../shared/messageError'
import ErrorGeneral from '../../shared/messageErrorGlobal'
import OkMsg from '../../shared/messageSuccess'

import {
	addBox,
	getBoxes,
	setBoxes,
	removeBox,
	moveBoxDown,
} from '../../models/boxes'
import { setFiles } from '../../models/files'

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
} from '../../models/frames'

import { getHive } from '../../models/hive';
import { getFiles } from '../../models/files'

import { setFrameSideFile } from '../../models/files'
import { Box } from '../../api/schema'

export default function HiveEditForm() {
	let { apiaryId, hiveId, boxSelected, frameSelected, frameSide } = useParams()

	let navigate = useNavigate()
	let {
		loading: loadingGet,
		error: errorGet,
		data: hiveGet,
	} = useQuery(HIVE_QUERY, { variables: { id: +hiveId } })

	let [updateHive, { loading: loadingUpdate, error, data }] =
		useMutation(HIVE_EDIT_MUTATION)
	let [updateFileStroke] = useMutation(FILE_STROKE_EDIT_MUTATION)
	
	const hive = useLiveQuery(getHive(+hiveId), [hiveId]);
	const boxes = useLiveQuery(getBoxes({ hiveId: +hiveId }), [hiveId]);
	const frames = useLiveQuery(getFrames({hiveId: +hiveId}), [hiveId]);


	if (!boxSelected) {
		boxSelected = '0'
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

	let okMsg

	if (data) {
		okMsg = <OkMsg />
	}

	// boxes
	function onBoxRemove(position) {
		removeAllFromBox({ hiveId: +hive.id, boxIndex: position })

		const boxes = getBoxes({ hiveId: +hive.id })

		removeBox({ hiveId: +hive.id, position })

		map(boxes, (v: Box) => {
			if (v.position >= position) {
				moveFramesToBox({
					hiveId: +hive.id,
					boxIndex: v.position + 1,
					toBoxIndex: v.position,
				})
			}
		})
	}

	function onMoveDown(index) {
		if (moveBoxDown({ hiveId: +hive.id, index })) {
			swapBox({
				hiveId: +hive.id,
				boxIndex: index,
				toBoxIndex: index - 1,
			})
		}
	}

	function onBoxAdd(boxType) {
		addBox({ hiveId: +hive.id, boxType })
	}

	// frames

	function onFrameAdd(boxIndex, frameType) {
		addFrame({
			hiveId: +hive.id,
			boxIndex,
			frameType,
		})
	}

	function onFrameRemove(boxIndex, framePosition) {
		removeFrame({
			hiveId: +hive.id,
			boxIndex,
			framePosition,
		})
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
			hiveId: +hiveId,
			removedIndex,
			addedIndex,
			boxIndex,
		})

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
			hiveId: +hiveId,
			boxIndex,
			position,
			side: side === 'left' ? 'leftSide' : 'rightSide',
			prop,
			value,
		})
	}

	function onFrameSideFileUpload({ boxIndex, position, side, uploadedFile }) {
		setFrameSideFile({
			hiveId: +hiveId,
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

			<HiveEditDetails hive={hive} boxes={boxes} />

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
