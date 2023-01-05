import React from 'react'

import styles from './styles.less'

export default function VisualForm({
	children,
	onSubmit,
	style = null,
}: {
	children?: any
	onSubmit?: any
	style?: any
}) {
	return (
		<form
			method="POST"
			style={style}
			className={styles.form}
			onSubmit={onSubmit}
		>
			{children}
		</form>
	)
}
