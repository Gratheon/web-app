import React from 'react'
import styles from './index.less'

type URL = string

type LinkProps = {
	href: URL
	children: any
	className?: string | null
}

export default function Link({
	href,
	children,
	className = styles.small,
}: LinkProps) {
	return (
		<a href={href} className={className}>
			{children}
		</a>
	)
}
