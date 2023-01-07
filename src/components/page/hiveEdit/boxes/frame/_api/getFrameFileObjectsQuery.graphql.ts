import { gql } from '@/components/api'

export default gql`
	query ($frameSideId: ID!) {
		hiveFrameSideFile(frameSideId: $frameSideId) {
			frameSideId
			strokeHistory
			detectedObjects
		}
	}
`
