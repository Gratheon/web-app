import React from 'react'

export default function CellBrushIcon({ size = 16, color = 'currentColor' }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<circle cx="12" cy="12" r="6.5" stroke={color} strokeWidth="1.8" />
			<circle cx="12" cy="12" r="2.2" fill={color} />
			<path d="M12 3.2V6.2M12 17.8V20.8M3.2 12H6.2M17.8 12H20.8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
		</svg>
	)
}

