import React from 'react'

export default ({ size = 16, onClick = () => { } }) => (
	<svg
		onClick={onClick}
		height={size}
		width={size}
		viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
		<path d="M 250.644 63.026 L 330.537 109.153 L 330.537 201.406 L 250.644 247.532 L 170.751 201.406 L 170.751 109.152 Z" style="stroke: white; paint-order: fill; fill: none; stroke-width: 30px; stroke-linecap: round; stroke-linejoin: round;" />
		<path d="M 358.148 245.068 L 438.041 291.195 L 438.041 383.448 L 358.148 429.574 L 278.255 383.448 L 278.255 291.195 Z" style="stroke: white; paint-order: fill; fill: none; stroke-width: 30px; stroke-linecap: round; stroke-linejoin: round;" />
		<path d="M 140.909 244.026 L 220.802 290.153 L 220.802 382.405 L 140.909 428.532 L 61.016 382.406 L 61.016 290.153 Z" style="stroke: white; paint-order: fill; fill: none; stroke-width: 30px; stroke-linecap: round; stroke-linejoin: round;" />
		<path d="M 249.484 167.547 L 329.377 213.674 L 329.377 305.927 L 249.484 352.053 L 169.591 305.927 L 169.591 213.674 Z" style="paint-order: fill; fill: none; stroke-width: 30px; stroke-linecap: round; stroke-linejoin: round; stroke: rgba(255, 255, 255, 0.53);" />
	</svg>
)
