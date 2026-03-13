import React from 'react'
import T from '@/shared/translate'
import imageURL from '@/assets/devices.webp'

export default function DevicesPlaceholder() {
	return (
		<div
			style={{
				textAlign: 'center',
				width: '100%',
				padding: '20px 0',
				color: 'gray',
			}}
		>
			<img height="156" src={imageURL} alt="Devices illustration" />
			<p><T>No devices yet</T></p>
		</div>
	)
}
