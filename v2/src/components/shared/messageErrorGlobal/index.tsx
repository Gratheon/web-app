import React from 'react'
import styles from './index.less'
import { lastNetworkError } from '../../api'

export default () => {
	if (lastNetworkError) {
		if (lastNetworkError.statusCode == 403) {
			return (
				<div className={styles.errorGeneral}>
					<span>🔒</span>
					<div>
						<h3>General error</h3>
						<pre>Unauthorized or expired session</pre>
						<pre>
							Please <a href="https://gratheon.com">login first</a>
						</pre>
					</div>
				</div>
			)
		} else {
			return (
				<div className={styles.errorGeneral}>
					<span>🔌</span>
					<div>
						<h3>Network error</h3>
						<pre>{lastNetworkError.message}</pre>
					</div>
				</div>
			)
		}
	}
}
