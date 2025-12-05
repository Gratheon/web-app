import { gql } from '../../../api'

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
			collapse_date
			collapse_cause
			splitDate

			parentHive {
				id
				name
			}

			childHives {
				id
				name
				splitDate
			}

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
