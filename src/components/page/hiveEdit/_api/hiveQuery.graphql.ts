import { gql } from '@/components/api'

export default gql`
	query hive($id: ID!, $apiaryId: ID!) {
		apiary(id: $apiaryId){
			id
			name
		}
		hive(id: $id) {
			id
			name
			notes
			beeCount
			inspectionCount

			files {
				hiveId
				frameSideId
				strokeHistory
				file {
					id
					url
				}
			}

			family {
				id
				race
				added
			}
		}
	}
`
