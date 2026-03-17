import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useQuery } from '@/api'
import Loader from '@/shared/loader'
import { getUser } from '@/models/user'
import Billing from '@/page/accountEdit/billing'
import Invoices from '@/page/accountEdit/invoices'
import styles from './style.module.less'

const USER_QUERY = gql`
	query user {
		user {
			... on User {
				id
				lang
				locale
				date_added
				date_expiration
				hasSubscription
				isSubscriptionExpired
				billingPlan
			}
		}
	}
`

export default function AccountBilling() {
	const { loading } = useQuery(USER_QUERY)
	const user = useLiveQuery(() => getUser(), [], null)

	if (loading || !user) {
		return <Loader />
	}

	return (
		<div className={styles.page}>
			<Billing user={user} />
			<Invoices />
		</div>
	)
}
