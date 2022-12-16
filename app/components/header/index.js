import React from 'react'
import { Component } from 'preact/dist/preact'
import styles from './index.less'
import { isLoggedIn } from '../user'

class Header extends Component {
	render() {
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
}

// Header.propTypes = {}

export default Header
