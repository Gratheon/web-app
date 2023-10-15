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
			estimatedDetectionTimeSec
			isBeeDetectionComplete

			detectedFrameResources
			detectedQueenCups

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
