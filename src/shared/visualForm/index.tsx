import React from 'react'

import styles from './styles.module.less'
import VisualFormSubmit from './submit'

export default function VisualForm({
	children,
	onSubmit,
	style = null,
	className,
	submitClassName,
	submit,
}: {
	children?: any
	onSubmit?: any
	style?: any
	className?: string
	submitClassName?: string
	submit?: any
}) {
	return (
		<form method="POST" style={style} onSubmit={onSubmit}>
			<div className={className ? `${styles.form} ${className}` : styles.form}>
				{children}
			</div>
			{submit && (
				<VisualFormSubmit className={submitClassName}>
					{submit}
				</VisualFormSubmit>
			)}
		</form>
	)
}
