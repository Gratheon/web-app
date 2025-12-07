import { gql } from '../../api'

export default gql`
	query inspections( $hiveId: ID!) {
		hive(id: $hiveId) {
			__typename
			id
			hiveNumber
			inspectionCount
		}

		inspections(hiveId: $hiveId, limit: 20) {
			__typename
			id
			hiveId
			added
			data
		}
	}
`
