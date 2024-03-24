import { gql } from '@/components/api'

export default gql`
	mutation addInspection($inspection: InspectionInput!) {
		addInspection(inspection: $inspection) {
			id
		}
	}
`
