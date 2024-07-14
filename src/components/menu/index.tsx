// @ts-nocheck
import React from 'react'
import { NavLink } from 'react-router-dom'

import Header from '@/components/header'
import { logout } from '@/components/user'
import { getAppUri } from '@/components/uri'
import T from '@/components/shared/translate'
import Avatar from '@/components/shared/avatar'

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
						<NavLink activeClassName={styles.active} to="/account/authenticate">
							Authentication
						</NavLink>
					</li>
					<li>
						<NavLink activeClassName={styles.active} to="/account/register">
							Registration
						</NavLink>
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
			<NavLink activeClassName={styles.active} to="/insights">
				<T ctx="this is a menu link to beehive data analytics">Insights</T>
			</NavLink>
		</li>)
	}

	
	return (
		<nav id={styles.menu}>
			<Header />

			<ul>
				<li>
					<NavLink
						className={({ isActive, isPending }) =>
							isActive ? styles.active : ""
						}
						to="/apiaries">
						<T>Hives</T>
					</NavLink>
				</li>
				<li>
					<NavLink
						className={({ isActive, isPending }) =>
							isActive ? styles.active : ""
						}
						to="/account">
						<div style="display:flex;">
							<Avatar style="margin-right:5px;" />
							<T>Account</T>
						</div>
					</NavLink>
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
