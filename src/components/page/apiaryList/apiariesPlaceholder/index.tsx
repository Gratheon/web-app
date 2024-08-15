import T from '../../../shared/translate'
import React from 'react'
import imageURL from '@/assets/flower.png'

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
			<p><T>No apiaries here yet</T></p>

			<img height="64" src={imageURL} />
		</div>
	)
}
