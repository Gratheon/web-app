export default function CalendarIcon({ size = 24, filled = false }) {
	const bodyFill = filled ? 'currentColor' : 'none'
	const detailColor = filled ? 'white' : 'currentColor'

	return (
		<svg
			height={size}
			width={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<rect
				x="4"
				y="5.5"
				width="16"
				height="14.5"
				rx="2.5"
				fill={bodyFill}
				stroke="currentColor"
				strokeWidth="2"
			/>
			<path
				d="M4 9.5H20"
				stroke={detailColor}
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M8 3.5V6.5"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M16 3.5V6.5"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
			/>
			<path
				d="M8 13H8.01M12 13H12.01M16 13H16.01M8 16.5H8.01M12 16.5H12.01"
				stroke={detailColor}
				strokeWidth="2"
				strokeLinecap="round"
			/>
		</svg>
	)
}
