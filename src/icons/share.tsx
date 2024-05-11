export default function ShareIcon({ size = 16, onClick = () => { } }) {
	return (
		<svg
			onClick={onClick}
			height={size}
			width={size}
			xmlns="http://www.w3.org/2000/svg"
			className="h-6 w-6"
			fill="currentColor"
			stroke="currentColor"
			viewBox="0 0 500 500">

			<circle cx="109.715" cy="233.068" r="50.404" transform="matrix(1, 0, 0, 1, 0, 2.842170943040401e-14)" />
			<circle cx="380.232" cy="381.592" r="50.404" transform="matrix(1, 0, 0, 1, 0, 2.842170943040401e-14)" />
			<circle cx="385.296" cy="103.99" r="50.404" transform="matrix(1, 0, 0, 1, 0, 2.842170943040401e-14)" />
			<path style="fill: none; stroke-miterlimit: 5.7; stroke-linecap: round; stroke-width: 29px;" 
			d="M 373.246 115.721 L 111.185 234.119 L 381.986 385.095" 
			transform="matrix(1, 0, 0, 1, 0, 2.842170943040401e-14)" />

		</svg>
	)
}