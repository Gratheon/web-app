export default function WarehouseHorizontalHiveIcon({ size = 16, onClick = () => {} }) {
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
			<rect x="2.5" y="8" width="19" height="8" rx="2" />
			<path d="M5 8V6.5" />
			<path d="M19 8V6.5" />
			<path d="M7.5 11V13" />
			<path d="M11 11V13" />
			<path d="M14.5 11V13" />
			<path d="M18 11V13" />
			<path d="M4 16V18.5" />
			<path d="M20 16V18.5" />
		</svg>
	)
}
