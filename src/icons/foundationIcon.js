import React from 'react'

export default ({ size = 16, onClick = () => { } }) => (
	<svg
		onClick={onClick}
		height={size}
		width={size}

		viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
		<path d="M 249.484 167.547 L 329.377 213.674 L 329.377 305.927 L 249.484 352.053 L 169.591 305.927 L 169.591 213.674 Z" style="paint-order: fill; fill: none; stroke-width: 30px; stroke-linecap: round; stroke-linejoin: round; stroke: rgba(255, 255, 255, 0.5);" />
	</svg>
)