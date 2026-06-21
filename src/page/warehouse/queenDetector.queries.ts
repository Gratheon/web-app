import { gql } from '@/api'

export const WAREHOUSE_QUEENS_QUERY = gql`
	query WarehouseQueensForDetector {
		warehouseQueens {
			id
			name
			race
			added
			color
		}
	}
`

export const ADD_WAREHOUSE_QUEEN_MUTATION = gql`
	mutation addWarehouseQueen($queen: FamilyInput!) {
		addWarehouseQueen(queen: $queen) {
			id
		}
	}
`

export const ADD_QUEEN_TO_HIVE_MUTATION = gql`
	mutation addQueenToHive($hiveId: ID!, $queen: FamilyInput!) {
		addQueenToHive(hiveId: $hiveId, queen: $queen) {
			id
			name
			race
			added
			color
		}
	}
`

export const ASSIGN_QUEEN_FROM_WAREHOUSE_MUTATION = gql`
	mutation assignQueenFromWarehouse($hiveId: ID!, $familyId: ID!) {
		assignQueenFromWarehouse(hiveId: $hiveId, familyId: $familyId) {
			id
			name
			race
			added
			color
		}
	}
`

export const UPLOAD_QUEEN_PREVIEW_MUTATION = gql`
	mutation uploadQueenPreview($file: Upload!) {
		uploadFrameSide(file: $file) {
			id
			url
		}
	}
`
