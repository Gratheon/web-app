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
						frameId

						frameSideFile {
							__typename
							frameSideId
							queenDetected
							isQueenDetectionComplete
							isBeeDetectionComplete
							isCellsDetectionComplete
							isQueenCupsDetectionComplete
						}
					}

					rightSide {
						__typename
						id
						frameId

						frameSideFile {
							__typename
							frameSideId
							queenDetected
							isQueenDetectionComplete
							isBeeDetectionComplete
							isCellsDetectionComplete
							isQueenCupsDetectionComplete
						}
					}
				}
			}
		}
	}
`
