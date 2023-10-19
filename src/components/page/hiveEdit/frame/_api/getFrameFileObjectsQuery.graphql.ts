import { gql } from '@/components/api'

export default gql`
	query ($frameSideId: ID!) {
		hiveFrameSideFile(frameSideId: $frameSideId) {
			frameSideId
			strokeHistory
			
			detectedBees
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
				resizes{
					max_dimension_px
					url
				}
			}
		}
	}
`