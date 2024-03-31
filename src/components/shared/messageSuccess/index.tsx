import React from 'react'
import styles from './index.less'

export default function MessageSuccess({ title = 'Saved!', message = '' }:{title?:any, message?:any}) {
	return (
		<div className={styles.successMsg}>
			<div>
				<strong>{title}</strong>
				{message && <p>{message}</p>}
			</div>
		</div>
	)
}
