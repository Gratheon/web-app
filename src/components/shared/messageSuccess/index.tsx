import React from 'react'

import WarnIcon from '@/components/icons/warn'

import styles from './index.less'

export default function MessageSuccess({ title = 'Saved!', message = '', isWarning=false }:{title?:any, message?:any, isWarning?:boolean}) {
	return (
		<div className={`${isWarning ? styles.warningMsg : styles.successMsg} ${styles.msg} `}>
			<div>
				<strong>{isWarning ? <WarnIcon size={14} /> : ''} {title}</strong>
				{message && <p>{message}</p>}
			</div>
		</div>
	)
}
