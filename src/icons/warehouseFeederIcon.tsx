export default function WarehouseFeederIcon({ size = 16, onClick = () => {} }) {
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
			<path d="M6 4.5H18V14.5C18 15.6 17.1 16.5 16 16.5H14V18.2C14 19.2 13.2 20 12.2 20H11.8C10.8 20 10 19.2 10 18.2V16.5H8C6.9 16.5 6 15.6 6 14.5V4.5Z" />
			<path d="M8 8H16" />
			<path d="M8 11H16" />
			<path d="M10.5 20.5H13.5" />
		</svg>
	)
}
