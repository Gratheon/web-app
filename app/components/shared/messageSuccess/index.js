import React from 'react'
import styles from './index.less'

export default ({ title = 'Saved!', message = '' }) => {
	return (
		<div className={styles.successMsg}>
			<span>🍯</span>
			<div>
				<h3>{title}</h3>
				{message && <p>{message}</p>}
			</div>
		</div>
	)
}
