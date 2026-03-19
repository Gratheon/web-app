import React from 'react'

export default function BrushSizeIcon({ size = 16, color = 'currentColor', dotRadius = 3 }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<circle cx="12" cy="12" r={dotRadius} fill={color} />
			<circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.25" strokeWidth="1.5" />
		</svg>
	)
}

