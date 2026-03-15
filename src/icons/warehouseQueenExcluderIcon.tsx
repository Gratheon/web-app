export default function WarehouseQueenExcluderIcon({ size = 16, onClick = () => {} }) {
	return (
		<svg
			onClick={onClick}
			height={size}
			width={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.6"
			strokeLinecap="round"
			strokeLinejoin="round"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect x="3.5" y="5.5" width="17" height="13" rx="1.5" />
			<path d="M12 5.5V18.5" />
			<path d="M3.5 12H20.5" />
			<path d="M6.5 18.5L11.5 5.5" />
			<path d="M12.5 18.5L17.5 5.5" />
		</svg>
	)
}
