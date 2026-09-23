import { graphqlWsClient } from '@/api'
import isDev from '@/isDev'
import ConnectionStatus from './connectionStatus'
import styles from './styles.module.less'

export default function Footer() {
	let apiUrl = 'https://graphql.gratheon.com/graphql'

	//@ts-ignore
	const isPWA =
		window.matchMedia('(display-mode: standalone)').matches ||
		// @ts-ignore
		window.navigator?.standalone
	const isMobile = window.innerWidth < 500

	if (isDev()) {
		apiUrl = 'http://localhost:6100/graphql'
	}

	return (
		<ul id={styles.footer}>
			{!(isPWA || isMobile) && (
				<li style={{ paddingTop: 4 }}>
					<ConnectionStatus graphqlWsClient={graphqlWsClient} />
				</li>
			)}
			{isDev() && (
				<li>
					<a href={apiUrl}>API</a>
				</li>
			)}
		</ul>
	)
}
