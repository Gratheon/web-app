import { gql } from '@/api'

export const BOX_SYSTEMS_FOR_HIVE_LABEL_QUERY = gql`
	query HiveTopInfoBoxSystems {
		boxSystems {
			id
			name
			isDefault
		}
	}
`

export const BOX_SYSTEM_COLORS = ['#2f80ed', '#f2994a', '#27ae60', '#eb5757']
