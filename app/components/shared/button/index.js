import React from 'react'
import styles from './index.less'

export default ({
	style: inlineStyle,
	title = '',
	loading = false,
	className = 'black',
	type = 'button',
	onClick,
	children,
}) => {
	let classNames = []
	if (typeof className === 'string') {
		classNames = [styles[className]]
	} else {
		for (const v of className) {
			classNames.push(styles[`${styles[v]}`])
		}
	}

	return (
		<button
			style={inlineStyle}
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
