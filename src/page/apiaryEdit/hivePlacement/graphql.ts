import { gql } from '../../../api'

export const GET_HIVE_PLACEMENTS = gql`
	query hivePlacements($apiaryId: ID!) {
		hivePlacements(apiaryId: $apiaryId) {
			hiveId
			x
			y
			rotation
		}
		apiaryObstacles(apiaryId: $apiaryId) {
			id
			type
			x
			y
			width
			height
			radius
			rotation
			label
		}
	}
`

export const UPDATE_HIVE_PLACEMENT = gql`
	mutation updateHivePlacement($apiaryId: ID!, $hiveId: ID!, $x: Float!, $y: Float!, $rotation: Float!) {
		updateHivePlacement(apiaryId: $apiaryId, hiveId: $hiveId, x: $x, y: $y, rotation: $rotation) {
			hiveId
		}
	}
`

export const ADD_OBSTACLE = gql`
	mutation addApiaryObstacle($apiaryId: ID!, $obstacle: ApiaryObstacleInput!) {
		addApiaryObstacle(apiaryId: $apiaryId, obstacle: $obstacle) {
			id
		}
	}
`

export const UPDATE_OBSTACLE = gql`
	mutation updateApiaryObstacle($id: ID!, $obstacle: ApiaryObstacleInput!) {
		updateApiaryObstacle(id: $id, obstacle: $obstacle) {
			id
		}
	}
`

export const DELETE_OBSTACLE = gql`
	mutation deleteApiaryObstacle($id: ID!) {
		deleteApiaryObstacle(id: $id)
	}
`

