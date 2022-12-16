import React from 'react'
import styles from './index.less'

export default function hiveNavigationPanel({ items }) {
	return (
		<div className={styles.breadcrumbs}>
			{items.map((row, i) => {
				return (
					<span key={i}>
						<a href={row.uri}>{row.name}</a>
						{i + 1 < items.length && <span>&nbsp;&rarr;&nbsp;</span>}
					</span>
				)
			})}
		</div>
	)
}
