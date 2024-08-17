export default function FeederIcon({ size = 16, onClick = () => { } }) {
	return (
		<svg
			onClick={onClick}
			height={size}
			width={size}
			xmlns="http://www.w3.org/2000/svg"
			className="h-6 w-6"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 500 500">

			<path style="stroke-linecap: round; stroke-width: 30px;" d="M 191.336 432.101 L 312.635 431.89" />
			<path style="stroke-linecap: round; stroke-width: 30px;" d="M 187.356 47.504 L 188.933 431.446" />
			<path style="stroke-linecap: round; stroke-width: 30px;" d="M 316.421 431.545 L 314.541 46.078" />
			<path style="stroke-linecap: round; fill: none; stroke-width: 22px;" d="M 218.809 125.288 C 221.047 122.198 223.075 118.992 225.495 116.096 C 227.53 113.66 229.562 111.072 232.031 109.4 C 243.722 101.479 250.598 120.881 259.898 123.939 C 269.273 127.023 279.93 114.784 284.656 109.127" />

		</svg>
	)
}