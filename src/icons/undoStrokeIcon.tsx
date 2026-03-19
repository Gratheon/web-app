import React from 'react'

export default function UndoStrokeIcon({ size = 16, color = 'currentColor' }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<path d="M8 7H3.5V2.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
			<path
				d="M4 7C5.9 4.6 8.9 3 12.3 3C18.2 3 21 7.1 21 12C21 16.9 18.2 21 12.3 21C9.4 21 6.9 19.9 5.1 18"
				stroke={color}
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}

