import React from 'react'

export default ({ size = 16, onClick = () => { } }) => (
	<svg xmlns="http://www.w3.org/2000/svg"
		onClick={onClick}
		height={size}
		width={size}
		viewBox="0 0 24 24">
		<path fill="currentColor" d="M22,21H21V2a1,1,0,0,0-1-1H4A1,1,0,0,0,3,2V21H2a1,1,0,0,0,0,2H22a1,1,0,0,0,0-2ZM19,3V5H5V3ZM9,21V16a3,3,0,0,1,6,0v5Zm8,0V16A5,5,0,0,0,7,16v5H5V7H19V21Z"/>
	</svg>
)