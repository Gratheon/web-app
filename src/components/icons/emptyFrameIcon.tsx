export default function EmptyFrameIcon({ size = 16, onClick = () => { } }) {
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

			<path style="stroke-linecap: round; stroke-width: 64px;" d="M 192.054 46.853 L 312 46.642" />
			<path style="stroke-linecap: round; stroke-width: 64px;" d="M 191.336 432.101 L 312 431.89" />
			{/* <path style="fill: rgb(216, 216, 216); stroke-width: 10px;" d="M 187.356 47.504 L 188.933 431.446" /> */}
			{/* <path style="fill: rgb(216, 216, 216); stroke-width: 10px;" d="M 316.421 431.545 L 314.541 46.078" /> */}
		</svg>
	)
}