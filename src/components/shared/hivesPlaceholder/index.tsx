import React from 'react'
import HiveIcon from '../hiveIcon'
import T from '../translate'

export default function () {
	return (
		<div
			style={{
				textAlign: 'center',
				width: '100%',
				padding: '20px 0',
				color: 'gray',
			}}
		>
			<p><T>No hives here yet</T></p>
			
			<img height="64" src="/assets/symbiosis.png" />
		</div>
	)
}
