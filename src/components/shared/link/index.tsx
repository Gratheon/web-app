import React from 'react'
import styles from './index.less'
import { useNavigate } from 'react-router-dom'

type URL = string

type LinkProps = {
	href: URL
	children: any
	className?: string | null
}

export default function Link({
	href,
	children,
}: LinkProps) {
	let navigate = useNavigate()
	return (
		<a style="cursor:pointer; text-decoration: underline;" onClick = {() => {
			if (href.startsWith('http')) {
				window.location.href = href
			} else {
				navigate(href, { replace: true })
			}
		}}>
			{children}
		</a>
	)
}
