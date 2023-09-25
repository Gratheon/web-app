import React from 'react'

export default ({ size = 16, onClick = () => { } }) => (
	<svg
		onClick={onClick}
		height={size}
		width={size}
		viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
		<rect x="21.499" y="93.641" width="459.57" height="298.24" style="stroke: white; fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-width: 30px;" rx="26.156" ry="26.156" />
		<path style="stroke: white; stroke-linecap: round; stroke-width: 30px;" d="M 78.06 187.342 L 77.561 287.149" />
		<path style="stroke: white; stroke-linecap: round; stroke-width: 30px;" d="M 129.118 187.358 L 128.619 287.165" />
		<path style="stroke: white; stroke-linecap: round; stroke-width: 30px;" d="M 175.464 188.178 L 174.963 287.987" />
		<path style="stroke: white; stroke-linecap: round; stroke-width: 30px;" d="M 226.522 188.196 L 226.024 288.001" />
		<path style="stroke: white; stroke-linecap: round; stroke-width: 30px;" d="M 276.671 189.022 L 276.171 288.828" />
		<path style="stroke: white; stroke-linecap: round; stroke-width: 30px;" d="M 327.729 189.038 L 327.231 288.844" />
		<path style="stroke: white; stroke-linecap: round; stroke-width: 30px;" d="M 374.074 189.858 L 373.574 289.666" />
		<path style="stroke: white; stroke-linecap: round; stroke-width: 30px;" d="M 425.133 189.875 L 424.633 289.682" />
	</svg>
)