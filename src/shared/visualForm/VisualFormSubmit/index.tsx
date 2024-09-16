import React from 'react'
import styles from './styles.module.less'

export default ({ children }) => {
	return <div className={styles.buttonsWrap}>{children}</div>
}
