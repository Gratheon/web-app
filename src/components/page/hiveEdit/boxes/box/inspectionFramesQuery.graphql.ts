import { gql } from '@/components/api'

export default gql`
	query frameSidesInspections($frameSideIds: [ID], $inspectionId: ID!) {
		frameSidesInspections(frameSideIds: $frameSideIds, inspectionId: $inspectionId) {
			frameSideId
			inspectionId
		}
	}
`
