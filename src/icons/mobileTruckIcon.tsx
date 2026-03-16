import React from 'react'

export default function MobileTruckIcon({ size = 20, color = 'currentColor' }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path
				d="M2.8 7.8h10.6v7.1h-1.1a2.7 2.7 0 0 0-5.3 0H5.8a2.7 2.7 0 0 0-2.9-2.3V7.8Z"
				stroke={color}
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M13.4 10h3.4l3 3.1v1.8h-1a2.7 2.7 0 0 0-5.4 0h-.1V10Z"
				stroke={color}
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<circle cx="9.7" cy="15.8" r="1.2" stroke={color} strokeWidth="1.3" />
			<circle cx="16.4" cy="15.8" r="1.2" stroke={color} strokeWidth="1.3" />
		</svg>
	)
}
