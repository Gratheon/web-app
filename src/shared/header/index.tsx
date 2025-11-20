import React from 'react'

import { isLoggedIn } from '@/user'
import logoURL from '@/assets/logo_v7.svg'

import styles from './index.module.less'

export default function Header() {
	if (isLoggedIn()) {
		return (
			<nav id={styles.header}>
				<a href="/apiaries">
					<img src={logoURL} />
				</a>
			</nav>
		)
	} else {
		return (
			<nav id={styles.header}>
				<a href="/account/authenticate">
					<img src={logoURL} />
				</a>
			</nav>
		)
	}
}
