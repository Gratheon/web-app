import { gql } from '../../../api'

export default gql`
	mutation addInspection($inspection: InspectionInput!) {
		addInspection(inspection: $inspection) {
			id
		}
	}
`
