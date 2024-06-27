import React from 'react'
import styles from './styles.less'

export default ({ children }) => {
	return (
		<div>
			<div></div>
			<div className={styles.buttonsWrap}>
				{children}
			</div>
		</div>
	)
}
