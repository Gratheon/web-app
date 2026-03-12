import T from '../../../shared/translate'
import React from 'react'
import imageURL from '@/assets/bear.webp'

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

			<img height="200" src={imageURL} alt="Bear and honey illustration" />
		</div>
	)
}
