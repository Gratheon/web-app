import { gql } from '@/components/api'

export default gql`
	query ($frameSideId: ID!) {
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

			queenDetected
			
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