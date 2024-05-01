import React from 'react'
import styles from './index.less'
import T from '../translate'

export default function ErrorMsg({ error }) {
	if (!error) return

	// log for console
	console.error({ error })

	if (error?.response?.status >= 500) {
		return (
			<div className={error?.graphQLErrors ? styles.errorMsgBig : styles.errorMsgSmall}>
				<h3><span>🐻</span> <T>Server error</T></h3>
				<p><T>Looks like our servers are unavailable</T></p>
			</div>
		)
	}

	// Backend / graphql errors
	if (error?.graphQLErrors) {
		return (
			<div className={error?.graphQLErrors ? styles.errorMsgBig : styles.errorMsgSmall}>
				<h3><span>🐻</span> <T>Server error</T></h3>

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

	// error can be a translation component
	return <div className={styles.errorMsgSmall}>
		<h3><span>🐻</span> {error}</h3>
	</div>
}