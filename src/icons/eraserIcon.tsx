import React from 'react'

export default function EraserIcon({ size = 16, color = 'currentColor' }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<path
				d="M4.8 14.8L12.8 6.8C13.6 6 14.9 6 15.7 6.8L19.2 10.3C20 11.1 20 12.4 19.2 13.2L13.2 19.2C12.4 20 11.1 20 10.3 19.2L4.8 13.7C4 12.9 4 11.6 4.8 10.8"
				stroke={color}
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path d="M9.8 19.8H20.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
		</svg>
	)
}

