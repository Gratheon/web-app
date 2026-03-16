import { gql } from '../../../api'

export default gql`
	query hive($id: ID!, $apiaryId: ID!) {
		apiary(id: $apiaryId){
			id
			name
		}
		boxSystems {
			id
			name
			isDefault
		}
		hive(id: $id) {
			id
			boxSystemId
			hiveNumber
			notes
			beeCount
			inspectionCount
			collapse_date
			collapse_cause
			splitDate

			parentHive {
				id
				hiveNumber
			}

			childHives {
				id
				hiveNumber
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
