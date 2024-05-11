export default function InspectionIcon({ size = 16, onClick = () => { } }) {
	return (
		<svg
			onClick={onClick}
			height={size}
			width={size}
			xmlns="http://www.w3.org/2000/svg"
			className="h-6 w-6"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 500 388">

			<path style="fill: none; stroke-width: 36px; stroke-linecap: round;" d="M 58.928 287.203 L 187.173 174.555 L 321.462 249.106 L 447.64 68.122" />

		</svg>
	)
}