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
			hiveNumber
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
				name
				race
				added
				color
			}

			families {
				id
				name
				race
				added
				color
			}
		}
	}
`
