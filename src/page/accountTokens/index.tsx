import { graphqlWsClient } from '@/api'
import TokenList from '@/page/accountEdit/token_list'
import EventApiStatus from '@/shared/eventApiStatus'
import styles from './style.module.less'

export default function AccountTokens() {
	return (
		<div className={styles.page}>
			<TokenList />
			<EventApiStatus graphqlWsClient={graphqlWsClient} />
		</div>
	)
}
