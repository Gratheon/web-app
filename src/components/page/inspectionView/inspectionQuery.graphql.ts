import { gql } from '@/components/api'

export default gql`
	query inspection($inspectionId: ID!, $hiveId: ID!) {
		inspection(inspectionId: $inspectionId) {
			id
			data
			added
		}
		hive(id: $hiveId) {
			id
			name
		}
	}
`
