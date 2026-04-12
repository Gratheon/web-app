import React from 'react'

export default function StaticTreeIcon({ size = 20, color = 'currentColor' }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path d="M12 13l-2 -2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M12 12l2 -2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
			<path d="M12 21v-13" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
			<path
				d="M9.824 16a3 3 0 0 1 -2.743 -3.69a3 3 0 0 1 .304 -4.833a3 3 0 0 1 4.615 -3.707a3 3 0 0 1 4.614 3.707a3 3 0 0 1 .305 4.833a3 3 0 0 1 -2.919 3.695h-4l-.176 -.005"
				stroke={color}
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	)
}
