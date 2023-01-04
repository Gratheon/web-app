import { gql, useQuery } from '../api'
import { useLocation, useNavigate } from 'react-router-dom'

const USER_QUERY = gql`
	query user {
		user {
			id
			isSubscriptionExpired
		}
	}
`;

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

	return null
}
