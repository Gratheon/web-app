import React from 'react'
import styles from './index.less'

export default function MessageSuccess({ title = 'Saved!', message = '', isWarning=false }:{title?:any, message?:any, isWarning?:boolean}) {
	return (
		<div className={`${isWarning ? styles.warningMsg : styles.successMsg} ${styles.msg} `}>
			<div>
				<strong>{title}</strong>
				{message && <p>{message}</p>}
			</div>
		</div>
	)
}
