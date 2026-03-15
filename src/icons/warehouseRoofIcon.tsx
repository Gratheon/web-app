export default function WarehouseRoofIcon({ size = 16, onClick = () => {} }) {
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
			<path d="M3 10L12 4L21 10" />
			<path d="M5 10V18H19V10" />
			<path d="M3 18H21" />
		</svg>
	)
}
