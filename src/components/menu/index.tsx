// @ts-nocheck
import React from 'react'
import { Link } from 'react-router-dom'

import Header from '@/components/header'
import { logout } from '@/components/user'
import { getAppUri } from '@/components/uri'
import T from '@/components/shared/translate'

import isDev from '@/components/isDev'
import styles from './styles.less'

async function onLogoutClick() {
	await logout()
	window.location.href = getAppUri() + '/account/authenticate/'
}

const Menu = ({ isLoggedIn = false }) => {
	if (!isLoggedIn) {
		return (
			<nav id={styles.menu}>
				<Header />
				<ul>
					<li>
						<Link activeClassName={styles.active} to="/account/authenticate">
							Authentication
						</Link>
					</li>
					<li>
						<Link activeClassName={styles.active} to="/account/register">
							Registration
						</Link>
					</li>
					{/*<li>*/}
					{/*	<Link activeClassName={styles.active} href="/account/restore">*/}
					{/*		Restoration*/}
					{/*	</Link>*/}
					{/*</li>*/}
				</ul>
			</nav>
		)
	}

	// hide analytics until its ready for prod release
	let analytics = null
	if (isDev()) {
		analytics = (<li>
			<Link activeClassName={styles.active} to="/analytics">
				<T>Analytics</T>
			</Link>
		</li>)
	}

	return (
		<nav id={styles.menu}>
			<Header />

			<ul>
				<li>
					<Link activeClassName={styles.active} to="/apiaries">
						<T>Hives</T>
					</Link>
				</li>
				<li>
					<Link activeClassName={styles.active} to="/account">
						<T>Account</T>
					</Link>
				</li>
				{analytics}
				<li>
					<a href="#" onClick={onLogoutClick}>
						<T>Log out</T>
					</a>
				</li>
			</ul>
		</nav>
	)
}

export default Menu
