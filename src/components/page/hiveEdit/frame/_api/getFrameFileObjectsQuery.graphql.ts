import { gql } from '@/components/api'

export default gql`
	query ($frameSideId: ID!) {
		hiveFrameSideFile(frameSideId: $frameSideId) {
			frameSideId
			strokeHistory
			estimatedDetectionTimeSec
			detectedBees
			detectedFrameResources
			file{
				id
				url
			}

			counts{
				type
				count
			}
		}
	}
`
