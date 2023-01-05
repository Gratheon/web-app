import React from 'react'

import styles from './index.less'
import { isLoggedIn } from '../user'

export default function Header() {
	if (isLoggedIn()) {
		return (
			<nav id={styles.header}>
				<a href="/apiaries">
					<img src="https://gratheon.com/img/logo_v4.svg" />
				</a>
			</nav>
		)
	} else {
		return (
			<nav id={styles.header}>
				<a href="/account/authenticate">
					<img src="https://gratheon.com/img/logo_v4.svg" />
				</a>
			</nav>
		)
	}
}
