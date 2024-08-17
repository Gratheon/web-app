import React from 'react'

import { graphqlWsClient } from '../api'
import isDev from '../isDev.ts'
import T from '../shared/translate'

import ConnectionStatus from './connectionStatus'
import styles from './styles.module.less'


export default function Footer() {
	let apiUrl = 'https://graphql.gratheon.com/graphql'

	//@ts-ignore
	const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator?.standalone;
	const isMobile = window.innerWidth < 500;


	if (isDev()) {
		apiUrl = 'http://localhost:6100/graphql'
	}

	return (
		<ul id={styles.footer}>
			{!(isPWA || isMobile) &&
				<li style={{ paddingTop: 4 }}>
					<ConnectionStatus graphqlWsClient={graphqlWsClient} />
				</li>}
			{!(isPWA || isMobile) && <li>
				<a href={apiUrl}>API</a>
			</li>}
			<li>
				<a href="https://gratheon.com/terms.html"><T ctx="link in page footer">Terms of Use</T></a>
			</li>
			<li>
				<a href="https://gratheon.com/privacy.html"><T ctx="link in page footer">Privacy policy</T></a>
			</li>
		</ul>
	)
}
