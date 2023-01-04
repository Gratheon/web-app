import { gql } from '../../../api'

export default gql`
	mutation updateHive($hive: HiveUpdateInput!) {
		updateHive(hive: $hive) {
			id
		}
	}
`
