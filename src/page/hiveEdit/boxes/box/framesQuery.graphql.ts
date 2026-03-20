import { gql } from '../../../../api'

export default gql`
	query hive($id: ID!) {
		hive(id: $id) {
			id
		}
	}
`
