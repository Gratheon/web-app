import React from 'react'
import styles from './index.less'

class Link {
	render({ href, children, className = styles.small }) {
		return (
			<a href={href} className={className}>
				{children}
			</a>
		)
	}
}

export default Link
