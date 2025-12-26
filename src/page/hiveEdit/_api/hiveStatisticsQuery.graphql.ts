import { gql } from '../../../api'

export default gql`
	query hiveStatistics($hiveId: ID!) {
		hiveStatistics(hiveId: $hiveId) {
			workerBeeCount
			droneCount
			varroaCount
		}
	}
`

