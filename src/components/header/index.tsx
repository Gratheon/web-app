import React from 'react'

import { isLoggedIn } from '@/components/user'

import styles from './index.less'

export default function Header() {
	if (isLoggedIn()) {
		return (
			<nav id={styles.header}>
				<a href="/apiaries">
					<img src="/assets/logo_v5.svg" />
				</a>
			</nav>
		)
	} else {
		return (
			<nav id={styles.header}>
				<a href="/account/authenticate">
					<img src="/assets/logo_v5.svg" />
				</a>
			</nav>
		)
	}
}
