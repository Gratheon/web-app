import { gql } from '../../../../api'

export default gql`
	query hive($id: ID!) {
		hive(id: $id) {
			id
			boxes {
				id
				frames {
					id
					position
					type
					leftSide {
						id
						frameId
					}
					rightSide {
						id
						frameId
					}
				}
			}
		}
	}
`
