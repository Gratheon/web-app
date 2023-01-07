import { gql } from '@/components/api'

export default gql`
	mutation deactivateHive($id: ID!) {
		deactivateHive(id: $id)
	}
`
