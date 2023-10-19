import { gql } from '@/components/api'

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
					}

					rightSide {
						id
					}
				}
			}
		}
	}
`
