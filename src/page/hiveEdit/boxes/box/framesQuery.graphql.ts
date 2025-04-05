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

						cells{
							id
							broodPercent
							honeyPercent
							pollenPercent
							eggsPercent
							cappedBroodPercent
						}
					}

					rightSide {
						id
						frameId
						
						cells{
							id
							broodPercent
							honeyPercent
							pollenPercent
							eggsPercent
							cappedBroodPercent
						}
					}
				}
			}
		}
	}
`
