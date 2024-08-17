import React from 'react'

export default ({ size = 16, onClick = () => { } }) => (
	<svg
		onClick={onClick}
		height={size}
		width={size}
		viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
		<rect x="21.499" y="168.313" width="459.57" height="143.306" style="stroke: white; fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-width: 30px;" rx="26.156" ry="26.156" />
		<path style="stroke: white; stroke-linecap: round; stroke-width: 30px;" d="M 78.06 205.861 L 77.561 273.473" />
		<path style="stroke: white; stroke-linecap: round; stroke-width: 30px;" d="M 129.118 205.872 L 128.619 273.484" />
		<path style="stroke: white; stroke-linecap: round; stroke-width: 30px;" d="M 175.464 206.428 L 174.963 274.041" />
		<path style="stroke: white; stroke-linecap: round; stroke-width: 30px;" d="M 226.522 206.44 L 226.024 274.05" />
		<path style="stroke: white; stroke-linecap: round; stroke-width: 30px;" d="M 276.671 206.999 L 276.171 274.611" />
		<path style="stroke: white; stroke-linecap: round; stroke-width: 30px;" d="M 327.729 207.01 L 327.231 274.622" />
		<path style="stroke: white; stroke-linecap: round; stroke-width: 30px;" d="M 374.074 207.566 L 373.574 275.178" />
		<path style="stroke: white; stroke-linecap: round; stroke-width: 30px;" d="M 425.133 207.577 L 424.633 275.189" />
	</svg>
)