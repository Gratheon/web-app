export default function ChartIcon({ size = 16, style = '' }) {
	return (
		<svg
			height={size}
			width={size}
			style={style}
			fill="white"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path d="M3 19h18v2H3zm1.4-2.4 4.8-6.2 3.6 2.9L20 5.6l1.2.9-7.8 9.8-3.7-3-3.7 4.8z" />
		</svg>
	)
}
