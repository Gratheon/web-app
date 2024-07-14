import { gql } from '@/components/api'

export default gql`
	query inspection($inspectionId: ID!, $hiveId: ID!) {
		inspection(inspectionId: $inspectionId) {
			__typename
			id
			hiveId
			data
			added
		}
		
		hive(id: $hiveId) {
			__typename
			id
			name
		}

		frameSidesInspections(inspectionId: $inspectionId) {
			__typename
			frameSideId
			inspectionId

			cells {
				id
				broodPercent
				honeyPercent
				pollenPercent
				eggsPercent
				cappedBroodPercent
			}

			file {
				__typename
				id				
				url
				
				resizes{
					__typename
					id
					max_dimension_px
					url
				}
			}
		}
	}
`
