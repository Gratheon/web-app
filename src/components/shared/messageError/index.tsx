import React from 'react'
import styles from './index.less'

export default ({ error }) => {
	if (!error) return
	return (
		<div
			className={
				error?.graphQLErrors ? styles.errorMsgBig : styles.errorMsgSmall
			}
		>

			<h3><span>🐻</span>{typeof error === 'string' ? error : 'Error'}</h3>

			{error?.graphQLErrors &&
				error.graphQLErrors.map((e, i) => {
					return (
						<pre key={i}>
							<strong>{e.path?.join(' > ')}</strong> {e.message}
						</pre>
					)
				})}
		</div>
	)
}
