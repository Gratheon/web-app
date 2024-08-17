import { gql } from '../../../api'

export default gql`
	query hive($id: ID!) {
		hive(id: $id) {
			__typename
			id
			boxes {
				__typename
				id
				position
				type
				color

				frames {
					__typename
					id
					position
					type

					leftSide {
						__typename
						id

						frameSideFile {
							__typename
							frameSideId
							queenDetected
						}
					}

					rightSide {
						__typename
						id

						frameSideFile {
							__typename
							frameSideId
							queenDetected
						}
					}
				}
			}
		}
	}
`
