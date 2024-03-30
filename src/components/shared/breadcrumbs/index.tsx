import React from 'react'
import styles from './index.less'
import { NavLink } from 'react-router-dom'

export default function BreadCrumbs({ items, children }) {
	return (
		<div className={styles.breadcrumbs}>
			<div>
				{items.map((row, i) => {
					return (
						<span key={i}>
							<NavLink to={row.uri}>{row.name}</NavLink>
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
