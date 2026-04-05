import React from 'react'

import WarnIcon from '@/icons/warn'

import styles from './index.module.less'

export default function MessageSuccess({ title = 'Saved!', message = '', isWarning=false, className = '' }:{title?:any, message?:any, isWarning?:boolean, className?:string}) {
	return (
		<div className={`${isWarning ? styles.warningMsg : styles.successMsg} ${styles.msg} ${className}`}>
			<div>
				<strong>{isWarning ? <WarnIcon size={14} /> : ''} {title}</strong>
				{message && <p>{message}</p>}
			</div>
		</div>
	)
}
