import { gql } from '../../../api'

export default gql`
	mutation deactivateHive($id: ID!) {
		deactivateHive(id: $id)
	}
`
