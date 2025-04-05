import { gql } from '../../../../api'

export default gql`
	query ($frameSideId: ID!) {
		hiveFrameSide(id: $frameSideId) {
			id
			isQueenConfirmed
		}
		hiveFrameSideCells(frameSideId: $frameSideId) {
			__typename
			id
			broodPercent
			cappedBroodPercent
			eggsPercent
			pollenPercent
			honeyPercent
		}
		
		hiveFrameSideFile(frameSideId: $frameSideId) {
			frameSideId
			strokeHistory
			
			detectedBees
			detectedVarroa
			varroaCount
			
			detectedQueenCount
			detectedWorkerBeeCount
			detectedDroneCount
			isBeeDetectionComplete

			detectedCells
			isCellsDetectionComplete

			detectedQueenCups
			isQueenCupsDetectionComplete

			file{
				id
				url
				resizes {
					max_dimension_px
					url
				}
			}
		}
	}
`
