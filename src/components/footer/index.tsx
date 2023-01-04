import React from 'react'

import ConnectionStatus from './connectionStatus'
import isDev from '../isDev'
import styles from './styles.less'
import { graphqlWsClient } from '../api'

export default function Footer() {
	let apiUrl = 'https://graphql.gratheon.com/graphql'

	if (isDev()) {
		apiUrl = 'http://localhost:6100/graphql'
	}

	return (
		<ul id={styles.footer}>
			<li style={{ paddingTop: 4 }}>
				<ConnectionStatus graphqlWsClient={graphqlWsClient} />
			</li>
			<li>
				<a href={apiUrl}>API</a>
			</li>
			<li>
				<a href="https://gratheon.com/terms">Terms of Use</a>
			</li>
			<li>
				<a href="https://gratheon.com/privacy">Privacy policy</a>
			</li>
		</ul>
	)
}
