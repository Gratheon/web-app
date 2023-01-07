import { gql } from '@/components/api'

export default gql`
	mutation updateHive($hive: HiveUpdateInput!) {
		updateHive(hive: $hive) {
			id
		}
	}
`
