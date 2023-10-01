import { gql } from '@/components/api'

export default gql`
	query ($frameSideId: ID!) {
		hiveFrameSideFile(frameSideId: $frameSideId) {
			frameSideId
			strokeHistory
			estimatedDetectionTimeSec
			
			detectedBees
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

			counts{
				type
				count
			}
		}
	}
`
