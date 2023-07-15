import { gql } from '@/components/api'

export default gql`
	query hive($id: ID!) {
		hive(id: $id) {
			id
			name
			notes

			files {
				hiveId
				frameSideId
				strokeHistory
				file {
					id
					url
				}
			}

			inspections(limit: 20) {
				id
				added
				data
			}

			family {
				id
				race
				added
			}

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
						broodPercent
						honeyPercent
						pollenPercent
						eggsPercent
						cappedBroodPercent
						queenDetected
					}

					rightSide {
						id
						broodPercent
						honeyPercent
						pollenPercent
						eggsPercent
						cappedBroodPercent
						queenDetected
					}
				}
			}
		}
	}
`
