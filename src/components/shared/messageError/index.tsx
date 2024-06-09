import React, { useState } from 'react'
import styles from './index.less'
import BearIcon from '@/components/icons/bear'
import T from '../translate'
import DeleteIcon from '@/components/icons/deleteIcon'

export default function ErrorMsg({ error }) {
	let [err, setError] = useState(error)

	if (!err) return

	// log for console
	console.error({ err })

	if (err && err?.response?.status >= 500) {
		return (
			<div className={err?.graphQLErrors ? styles.errorMsgBig : styles.errorMsgSmall}>
				<BearIcon size={24} />
				<div>
					<h3><T>Server error</T></h3>
					<p><T>Looks like our servers are unavailable</T></p>
				</div>
				<DeleteIcon size={24} onClick={() => { setError(null) }} />
			</div>
		)
	}

	// Backend / graphql errors
	if (err?.graphQLErrors) {
		return (
			<div className={err?.graphQLErrors ? styles.errorMsgBig : styles.errorMsgSmall}>
				<BearIcon size={24} />
				<div>
					<h3><T>Server error</T></h3>
					{err?.graphQLErrors &&
						err.graphQLErrors.map((e, i) => {
							return (
								<pre key={i}>
									<strong>{e.path?.join(' > ')}</strong> {e.message}
								</pre>
							)
						})}
				</div>
				<DeleteIcon size={24} onClick={() => { setError(null) }} />
			</div>
		)
	}

	// error can be a translation component
	return <div className={styles.errorMsgSmall}>
		<BearIcon size={24} />
		<div><h3>{err}</h3></div>
		<DeleteIcon size={24} onClick={() => { setError(null) }} />
	</div>
}