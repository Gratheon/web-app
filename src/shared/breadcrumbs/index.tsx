import React from 'react'
import styles from './index.module.less'
import { NavLink } from 'react-router-dom'

export default function BreadCrumbs({ items, children }) {
	return (
		<div className={styles.breadcrumbs}>
			<div>
				{items.map((breadcrumb, i) => {
					return (
						<>
							{breadcrumb.icon}
							<span><NavLink to={breadcrumb.uri}>{breadcrumb.name}</NavLink></span>
							{i + 1 < items.length && <span>&nbsp;&rarr;&nbsp;</span>}
						</>
					)
				})}
			</div>
			<div>
				{children}
			</div>
		</div>
	)
}
