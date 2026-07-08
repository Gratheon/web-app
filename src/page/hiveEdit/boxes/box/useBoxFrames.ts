import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useSubscription } from '@/api'
import { getFrames } from '@/models/frames'
import { enrichFramesWithSides } from '@/models/frameSide'
import { enrichFramesWithSideFiles } from '@/models/frameSideFile'
import {
	enrichFramesWithSideCells,
	getFrameSideCells,
	newFrameSideCells,
	updateFrameSideCells,
} from '@/models/frameSideCells'

export function useBoxFrames(boxId: number, hiveId: number) {
	useSubscription(
		gql`
			subscription onHiveFrameSideCellsDetected($hiveId: String) {
				onHiveFrameSideCellsDetected(hiveId: $hiveId) {
					delta
					isCellsDetectionComplete

					frameSideId
					broodPercent
					droneBroodPercent
					cappedBroodPercent
					eggsPercent
					nectarPercent
					pollenPercent
					honeyPercent
				}
			}
		`,
		{ hiveId },
		async (_, response) => {
			if (response) {
				let updatedFrameSideId =
					+response.onHiveFrameSideCellsDetected.frameSideId
				let frameSideFile =
					(await getFrameSideCells(updatedFrameSideId)) ||
					newFrameSideCells(updatedFrameSideId, hiveId)

				frameSideFile.broodPercent =
					response.onHiveFrameSideCellsDetected.broodPercent
				frameSideFile.droneBroodPercent =
					response.onHiveFrameSideCellsDetected.droneBroodPercent
				frameSideFile.cappedBroodPercent =
					response.onHiveFrameSideCellsDetected.cappedBroodPercent
				frameSideFile.eggsPercent =
					response.onHiveFrameSideCellsDetected.eggsPercent
				frameSideFile.nectarPercent =
					response.onHiveFrameSideCellsDetected.nectarPercent
				frameSideFile.pollenPercent =
					response.onHiveFrameSideCellsDetected.pollenPercent
				frameSideFile.honeyPercent =
					response.onHiveFrameSideCellsDetected.honeyPercent

				await updateFrameSideCells(frameSideFile)
			}
		}
	)

	return useLiveQuery(
		async () => {
			const framesWithoutSides = await getFrames({ boxId })
			if (!framesWithoutSides) return null
			const framesWithoutCells = await enrichFramesWithSides(framesWithoutSides)
			if (!framesWithoutCells) return null
			const framesWithoutFiles = await enrichFramesWithSideCells(
				framesWithoutCells
			)
			if (!framesWithoutFiles) return null
			return await enrichFramesWithSideFiles(framesWithoutFiles)
		},
		[boxId],
		false
	)
}
