export default function WarehouseBottomIcon({ size = 16, onClick = () => {} }) {
	return (
		<svg
			onClick={onClick}
			height={size}
			width={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.8"
			strokeLinecap="round"
			strokeLinejoin="round"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M4 8H20" />
			<path d="M6 8V15H18V8" />
			<path d="M3 15H21" />
			<path d="M8 19H16" />
		</svg>
	)
}
