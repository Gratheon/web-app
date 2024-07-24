import { gql, useQuery } from '@/components/api'
import metrics from '@/components/metrics'
import ErrorMsg from '@/components/shared/messageError'
import { useLocation, useNavigate } from 'react-router-dom'

const USER_QUERY = gql`
	query user {
		user {
			id
			lang
			isSubscriptionExpired
			billingPlan
		}
	}
`

export default function Paywall({ isLoggedIn = false }) {
	if(!isLoggedIn){
		return null
	}

	let { data: accountData, error } = useQuery(USER_QUERY)
	const location = useLocation()
	const navigate = useNavigate()
	const isInAccountView = location.pathname.match('/account(.*)') !== null

	if (error) {
		return <ErrorMsg error={error} />
	}

	if (
		!isInAccountView &&
		accountData?.user?.isSubscriptionExpired === true &&
		accountData?.user?.billingPlan !== 'free'
	) {
		navigate(`/account`, { replace: true })
	}

	if (accountData?.user.id) {
		metrics.setUserId(accountData?.user.id);
	}

	return null
}
