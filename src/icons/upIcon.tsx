import React from 'react'

export default function UpIcon({ size = 16, onClick = () => { } }) {
	return <svg onClick={onClick}
		height={size}
		width={size}
		xmlns="http://www.w3.org/2000/svg"
		fill="white"
		viewBox="0 0 512 512"
		stroke="currentColor">

		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M128.4,189.3L233.4,89c5.8-6,13.7-9,22.4-9c8.7,0,16.5,3,22.4,9l105.4,100.3c12.5,11.9,12.5,31.3,0,43.2  c-12.5,11.9-32.7,11.9-45.2,0L288,184.4v217c0,16.9-14.3,30.6-32,30.6c-17.7,0-32-13.7-32-30.6v-217l-50.4,48.2  c-12.5,11.9-32.7,11.9-45.2,0C115.9,220.6,115.9,201.3,128.4,189.3z" />
	</svg>
}