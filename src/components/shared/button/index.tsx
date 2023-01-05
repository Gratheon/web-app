import React from 'react'
import styles from './index.less'

type ButtonProps = {
	onClick?: any
	className?: string | string[]
	style?: any
	title?: string
	loading?: boolean
	type?: 'button' | 'submit' | 'reset' | undefined
	children?: any
}

export default function Button({
	style = {},
	title = '',
	loading = false,
	className = 'black',
	type = 'button',
	onClick = () => {},
	children = null,
}: ButtonProps) {
	let classNames = []
	if (typeof className === 'string') {
		classNames = [styles[className]]
	} else {
		// @ts-ignore
		for (const v of className) {
			classNames.push(styles[`${styles[v]}`])
		}
	}

	return (
		<button
			style={style}
			disabled={loading}
			type={type}
			title={title}
			className={classNames.join(' ')}
			onClick={onClick}
		>
			{children}
		</button>
	)
}
