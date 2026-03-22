import React, { useEffect, useState } from 'react'

import BearIcon from '@/icons/bear'
import DeleteIcon from '@/icons/deleteIcon'
import ServiceDegradedWarning from '@/shared/serviceDegradedWarning'

import styles from './index.module.less'

const UPSTREAM_SERVICE_BY_HOST = {
	'image-splitter': 'Image analysis service',
	'swarm-api': 'Hive data service',
	'telemetry-api': 'Telemetry service',
	'alerts': 'Alerts service',
}

const UPSTREAM_FAILURE_PATTERN = /(ENOTFOUND|EAI_AGAIN|ECONNREFUSED|ECONNRESET|ETIMEDOUT|socket hang up|fetch failed|network error)/i
const GRAPHQL_UPSTREAM_URL_PATTERN = /request to https?:\/\/([^/:]+)(?::\d+)?\/graphql failed/i

function getUpstreamFailureServiceName(graphQLErrors: any[] = []) {
	for (const gqlError of graphQLErrors) {
		const message = String(gqlError?.message || '')
		if (!UPSTREAM_FAILURE_PATTERN.test(message)) {
			continue
		}

		const hostMatch = message.match(GRAPHQL_UPSTREAM_URL_PATTERN)
		const host = hostMatch?.[1]
		if (!host) {
			return 'A backend service'
		}

		return UPSTREAM_SERVICE_BY_HOST[host] || 'A backend service'
	}

	return null
}

export default function ErrorMsg({ key=null, error, borderRadius=5 }) {
    const [visible, setVisible] = useState(true);
    const [stacktraceVisible, setStacktraceVisible] = useState(false);

    useEffect(() => {
        if (error) {
            setVisible(true);
        }
    }, [error]);

    if (!error || !visible) return null;

	console.error({
		error
	})

	if (error && error?.networkError) {
		return (
			<div className={styles.errorMsgSmall}>
				<div style="width:24px"><BearIcon size={24} /></div>
				<div className={styles.message}>
					<h3>{error.name}</h3>
					<pre>{error?.stack}</pre>
				</div>
				<DeleteIcon size={24} onClick={() => { setVisible(false) }} />
			</div>
		)
	}

	if (error && error?.response?.status >= 500) {
		return (
			<div className={styles.errorMsgSmall}>
				<div style="width:24px"><BearIcon size={24} /></div>
				<div className={styles.message}>
					<h3>Server error</h3>
					<p>Looks like our servers are unavailable</p>
				</div>
				<DeleteIcon size={24} onClick={() => { setVisible(false) }} />
			</div>
		)
	}

	// Backend / graphql errors
	if (error?.graphQLErrors) {
		const degradedServiceName = getUpstreamFailureServiceName(error.graphQLErrors)
		if (degradedServiceName) {
			return <ServiceDegradedWarning />
		}

		return (
			<div className={error?.graphQLErrors ? styles.errorMsgBig : styles.errorMsgSmall}>
				<div style="width:24px"><BearIcon size={24} /></div>
				<div className={styles.message}>
					<h3>Server error</h3>
					{error?.graphQLErrors &&
						error.graphQLErrors.map((e, i) => {
							return (
								<pre key={i}>
									GraphQL error: {e.message}<br/>
									{e.originalError?.extensions.exception.path && <>Path: {e.originalError.extensions.exception.path?.join('.')}</>}
								</pre>
							)
						})}
				</div>
				<DeleteIcon size={24} onClick={() => { setVisible(false) }} />
			</div>
		)
	}

	if(error?.message) {
		return <div key={key} className={styles.errorMsgSmall} style={{borderRadius}}>
			<div style="width:24px" onClick={()=>{
				setStacktraceVisible(!stacktraceVisible)
			}}><BearIcon size={24} /></div>
			<div className={styles.message}>
				<h3>{Object.getPrototypeOf(error)?.constructor?.name} {error.name}</h3>
				<pre>
					{error.message}
				</pre>
				{stacktraceVisible && <pre>
					{error.inner?.stack}
				</pre>}
			</div>
			<DeleteIcon size={24} onClick={() => { setVisible(false) }} />
		</div>
	}

	// error can be a translation component
	return <div className={styles.errorMsgSmall} style={{borderRadius}}>
		<div style="width:24px"><BearIcon size={24} /></div>
		<div className={styles.message}><h3>{error}</h3></div>
		<DeleteIcon size={24} onClick={() => { setVisible(false) }} />
	</div>
}
