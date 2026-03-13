import React from 'react'

import { isLoggedIn } from '@/user'
import defaultLogoURL from '@/assets/logo_v7.svg'

import styles from './index.module.less'

type HeaderProps = {
	onLogoClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void
	loggedInHref?: string
	loggedOutHref?: string
	className?: string
	logoSrc?: string
}

export default function Header({ onLogoClick, loggedInHref = '/apiaries', loggedOutHref = '/account/authenticate', className = '', logoSrc = defaultLogoURL }: HeaderProps) {
	if (isLoggedIn()) {
		return (
			<nav className={`${styles.header} ${className}`.trim()}>
				<a href={loggedInHref} onClick={onLogoClick}>
					<img src={logoSrc} />
				</a>
			</nav>
		)
	} else {
		return (
			<nav className={`${styles.header} ${className}`.trim()}>
				<a href={loggedOutHref} onClick={onLogoClick}>
					<img src={logoSrc} />
				</a>
			</nav>
		)
	}
}
