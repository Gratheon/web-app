import React from 'react'
import styles from './index.less'

export default function BreadCrumbs({ items, children }) {
	return (
		<div className={styles.breadcrumbs}>
			<div>
				{items.map((row, i) => {
					return (
						<span key={i}>
							<a href={row.uri}>{row.name}</a>
							{i + 1 < items.length && <span>&nbsp;&rarr;&nbsp;</span>}
						</span>
					)
				})}
			</div>
			<div>
				{children}
			</div>
		</div>
	)
}
