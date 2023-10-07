import React from 'react'

import { graphqlWsClient } from '@/components/api'
import isDev from '@/components/isDev'
import T from '@/components/shared/translate'

import ConnectionStatus from './connectionStatus'
import styles from './styles.less'


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
				<a href="https://gratheon.com/terms.html"><T ctx="link in page footer">Terms of Use</T></a>
			</li>
			<li>
				<a href="https://gratheon.com/privacy.html"><T ctx="link in page footer">Privacy policy</T></a>
			</li>
		</ul>
	)
}
