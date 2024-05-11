import React from 'react'

export default function HiveIcon({ size = 16, onClick = () => { } }) {
	return (
		<svg
			onClick={onClick}
			height={size}
			width={size}
			xmlns="http://www.w3.org/2000/svg"
			className="h-6 w-6"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 500 500">


			<rect x="72.151" y="110.171" width="364.887" height="167.835" style="stroke-linejoin: round; fill: none; stroke-width: 48px;" transform="matrix(1, 0, 0, 1, 0, 1.4210854715202004e-14)" />
			<rect x="72.553" y="278.218" width="364.887" height="158.993" style="stroke-linejoin: round; fill: none; stroke-width: 48px;" transform="matrix(1, 0, 0, 1, 0, 1.4210854715202004e-14)" />
			<rect x="45.539" y="60.495" width="414.297" height="48.475" style="stroke-linejoin: round; fill: none; stroke-width: 48px;" transform="matrix(1, 0, 0, 1, 0, 1.4210854715202004e-14)" />
			<rect x="87.589" y="437.586" width="1.651" height="29.667" style="stroke-linejoin: round; fill: none; stroke-width: 48px;" transform="matrix(1, 0, 0, 1, 0, 1.4210854715202004e-14)" />
			<rect x="419.389" y="437.459" width="1.651" height="29.667" style="stroke-linejoin: round; fill: none; stroke-width: 48px;" transform="matrix(1, 0, 0, 1, 0, 1.4210854715202004e-14)" />

		</svg>
	)
}