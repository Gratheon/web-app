import { gql } from '@/api'

export const HIVE_CREATION_LIMIT_QUERY = gql`
	query HiveCreationLimitContext {
		apiaries {
			id
			hives {
				id
			}
		}
	}
`

export const BOX_SYSTEMS_QUERY = gql`
	query BoxSystemsForHiveCreate {
		boxSystems {
			id
			name
			isDefault
		}
		boxSystemFrameSettings {
			systemId
			boxType
			frameSourceSystemId
		}
	}
`

export const WAREHOUSE_INVENTORY_QUERY = gql`
	query HiveCreateWarehouseInventory {
		warehouseInventory {
			key
			kind
			count
			moduleType
			frameSpec {
				frameType
				systemId
				code
			}
		}
	}
`

export const HIVE_CREATE_DEDUCTION_CONTEXT_QUERY = gql`
	query HiveCreateDeductionContext($id: ID!) {
		hive(id: $id) {
			id
			hiveType
			boxes {
				id
				type
				roofStyle
				frames {
					id
					position
					type
					leftSide {
						id
						frameId
					}
					rightSide {
						id
						frameId
					}
				}
			}
		}
	}
`

export const SET_WAREHOUSE_INVENTORY_COUNT_MUTATION = gql`
	mutation setWarehouseInventoryCount($itemKey: String!, $count: Int!) {
		setWarehouseInventoryCount(itemKey: $itemKey, count: $count) {
			key
			count
		}
	}
`

export const ADD_HIVE_MUTATION = gql`
	mutation addHive(
		$hiveNumber: Int
		$hiveType: HiveType
		$boxCount: Int!
		$frameCount: Int!
		$apiaryId: ID!
		$colors: [String]
		$initialBoxType: BoxType
		$boxSystemId: ID
	) {
		addHive(
			hive: {
				hiveNumber: $hiveNumber
				hiveType: $hiveType
				boxCount: $boxCount
				frameCount: $frameCount
				initialBoxType: $initialBoxType
				boxSystemId: $boxSystemId
				apiaryId: $apiaryId
				colors: $colors
			}
		) {
			id
			hiveNumber
			boxCount
		}
	}
`
