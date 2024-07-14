import React, { useEffect, useState } from 'react'
import styles from './index.less'
import BearIcon from '@/components/icons/bear'
import T from '../translate'
import DeleteIcon from '@/components/icons/deleteIcon'

export default function ErrorMsg({ error, borderRadius=5 }) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (error) {
            setVisible(true);
        }
    }, [error]);

    if (!error || !visible) return null;

	console.error({
		error
	})

	if (error && error?.response?.status >= 500) {
		return (
			<div className={error?.graphQLErrors ? styles.errorMsgBig : styles.errorMsgSmall}>
				<div style="width:24px"><BearIcon size={24} /></div>
				<div className={styles.message}>
					<h3><T>Server error</T></h3>
					<p><T>Looks like our servers are unavailable</T></p>
				</div>
				<DeleteIcon size={24} onClick={() => { setVisible(false) }} />
			</div>
		)
	}

	// Backend / graphql errors
	if (error?.graphQLErrors) {
		return (
			<div className={error?.graphQLErrors ? styles.errorMsgBig : styles.errorMsgSmall}>
				<div style="width:24px"><BearIcon size={24} /></div>
				<div className={styles.message}>
					<h3><T>Server error</T></h3>
					{error?.graphQLErrors &&
						error.graphQLErrors.map((e, i) => {
							return (
								<pre key={i}>
									GraphQL error: {e.message}<br/>
									{e.originalError.extensions.exception.path && <>Path: {e.originalError.extensions.exception.path?.join('.')}</>}
								</pre>
							)
						})}
				</div>
				<DeleteIcon size={24} onClick={() => { setVisible(false) }} />
			</div>
		)
	}

	// error can be a translation component
	return <div className={styles.errorMsgSmall} style={{borderRadius}}>
		<div style="width:24px"><BearIcon size={24} /></div>
		<div className={styles.message}><h3>{error}</h3></div>
		<DeleteIcon size={24} onClick={() => { setVisible(false) }} />
	</div>
}