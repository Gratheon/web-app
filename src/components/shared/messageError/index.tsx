import React from 'react'
import styles from './index.less'

export default ({ error }) => {
	return (
		<div
			className={
				error?.graphQLErrors ? styles.errorMsgBig : styles.errorMsgSmall
			}
		>
			<span>🐻</span>
			<div>
				<h3>{typeof error === 'string' ? error : 'API error'}</h3>
				{error?.stack && <pre>{error.stack}</pre>}

				{error?.graphQLErrors &&
					error.graphQLErrors.map((e, i) => {
						return (
							<pre key={i}>
								<strong>{e.path?.join(' > ')}</strong> {e.message}
							</pre>
						)
					})}
			</div>
		</div>
	)
}
