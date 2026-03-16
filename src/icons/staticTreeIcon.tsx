import React from 'react'

export default function StaticTreeIcon({ size = 20, color = 'currentColor' }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path
				d="M12 3L7.5 9h2.7L7 13.2h2.9L8.6 16h6.8l-1.3-2.8H17L13.8 9h2.7L12 3Z"
				stroke={color}
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path d="M12 16v5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
		</svg>
	)
}
