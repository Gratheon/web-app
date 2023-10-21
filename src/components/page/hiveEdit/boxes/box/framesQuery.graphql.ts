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
