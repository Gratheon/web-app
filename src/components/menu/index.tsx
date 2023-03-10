// @ts-nocheck
import React from 'react'
import { Link } from 'react-router-dom'

import Header from '@/components/header'
import { logout } from '@/components/user'
import { getAppUri } from '@/components/uri'

import styles from './styles.less'

const logOut = () => {
	logout()
	window.location.href = getAppUri() + '/'
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

	return (
		<nav id={styles.menu}>
			<Header />

			<ul>
				<li>
					<Link activeClassName={styles.active} to="/apiaries">
						Hives
					</Link>
				</li>
				<li>
					<Link activeClassName={styles.active} to="/account">
						Account
					</Link>
				</li>
				<li>
					<a href="#" onClick={logOut}>
						Log out
					</a>
				</li>
			</ul>
		</nav>
	)
}

export default Menu
