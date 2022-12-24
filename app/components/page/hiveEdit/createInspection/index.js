import React from 'react'

import Button from '../../../shared/button'
import Loader from '../../../shared/loader'
import { omitTypeName, useMutation } from '../../../api'
import CREATE_INSPECTION_MUTATION from './createInspectionMutation.graphql'
import { getBoxes } from '../../../../storage/boxes'
import { getFrames } from '../../../../storage/frames'
import ErrorMsg from '../../../shared/messageError'

export default function inspectionForm({ onBeforeSave, hive }) {
	let [createInspection, { loadingCreateInspection, errorCreatingInspection }] =
		useMutation(CREATE_INSPECTION_MUTATION)

	function addInspection(e) {
		e.preventDefault()

		if (!onBeforeSave(e)) {
			console.log('Parent saving failed, not creating new inspection')
			return
		}

		let tmpBoxes = getBoxes({ hiveId: hive.id })

		let inspection = {
			boxes: omitTypeName(tmpBoxes),
			name: hive.name,
			family: omitTypeName(hive.family),
			frames: getFrames({
				hiveId: hive.id,
			}),
		}

		inspection.stats = {
			honey: 0,
			brood: 0,
			pollen: 0,
			droneBrood: 0,
			cappedBrood: 0,
		}
		for (let box of inspection.boxes) {
			for (let frame of box.frames) {
				if (frame.leftSide.honeyPercent > 0) {
					inspection.stats.honey += frame.leftSide.honeyPercent / 100
				}
				if (frame.rightSide.honeyPercent > 0) {
					inspection.stats.honey += frame.rightSide.honeyPercent / 100
				}
			}
		}

		createInspection({
			inspection: {
				hiveId: hive.id,
				data: JSON.stringify(inspection),
			},
		})
	}

	if (loadingCreateInspection) {
		return <Loader />
	}

	if (errorCreatingInspection) {
		return <ErrorMsg error={errorCreatingInspection} />
	}

	return (
		<Button
			title="Add inspection"
			onClick={(e) => {
				addInspection(e)
			}}
		>
			Save as inspection
		</Button>
	)
}
