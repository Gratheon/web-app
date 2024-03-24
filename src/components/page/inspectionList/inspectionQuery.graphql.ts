import { gql } from '@/components/api'

export default gql`
	query inspections( $hiveId: ID!) {
		hive(id: $hiveId) {
			__typename
			id
			name

			inspections(limit: 20) {
				__typename
				id
				added
				data
			}
		}
	}
`
