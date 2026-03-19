import React from 'react'

export default function FreeDrawIcon({ size = 16, color = 'currentColor' }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
			<path d="M3.5 20.5L7.8 19.4L18.6 8.6C19.3 7.9 19.3 6.8 18.6 6.1L17.9 5.4C17.2 4.7 16.1 4.7 15.4 5.4L4.6 16.2L3.5 20.5Z" stroke={color} strokeWidth="1.9" strokeLinejoin="round" />
			<path d="M14.4 6.4L17.6 9.6" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
			<path d="M4.5 20L8 19.1" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
		</svg>
	)
}
