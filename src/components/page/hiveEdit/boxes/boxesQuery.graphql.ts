import { gql } from '@/components/api'

export default gql`
	query hive($id: ID!) {
		hive(id: $id) {
			id
			boxes {
				id
				position
				type
				color

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
