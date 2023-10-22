import { gql, useQuery } from '@/components/api'
import metrics from '@/components/metrics'
import { useLocation, useNavigate } from 'react-router-dom'

const USER_QUERY = gql`
	query user {
		user {
			id
			lang
			isSubscriptionExpired
		}
	}
`

export default function Paywall({ isLoggedIn = false }) {
	let { data: accountData } = useQuery(USER_QUERY)
	const location = useLocation()
	const navigate = useNavigate()
	const isInAccountView = location.pathname.match('/account(.*)') !== null

	if (
		isLoggedIn &&
		!isInAccountView &&
		accountData?.user?.isSubscriptionExpired === true
	) {
		navigate(`/account`, { replace: true })
	}

	if(isLoggedIn && accountData?.user.id){
		metrics.setUserId(accountData?.user.id);
	}

	return null
}
