// @ts-nocheck
export const MOBILE_NAV_ICON_SIZE = 24

// Mobile nav icons accept `filled` so selection is conveyed by the icon shape together with the active color.
export function HamburgerIcon({ size = MOBILE_NAV_ICON_SIZE, filled = false }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			{filled && (
				<rect
					x="3.5"
					y="4.5"
					width="17"
					height="15"
					rx="3.5"
					fill="currentColor"
				/>
			)}
			<rect
				x="6"
				y="8"
				width="12"
				height="2"
				rx="1"
				fill={filled ? 'white' : 'currentColor'}
			/>
			<rect
				x="6"
				y="11"
				width="12"
				height="2"
				rx="1"
				fill={filled ? 'white' : 'currentColor'}
			/>
			<rect
				x="6"
				y="14"
				width="12"
				height="2"
				rx="1"
				fill={filled ? 'white' : 'currentColor'}
			/>
		</svg>
	)
}

export function LightBulbIcon({ size = MOBILE_NAV_ICON_SIZE, filled = false }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M9.5 17H14.5"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<path
				d="M10 20H14"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<path
				d="M12 4C9.79 4 8 5.79 8 8C8 9.73 9.1 11.2 10.64 11.76C11.03 11.9 11.3 12.27 11.3 12.69V14H12.7V12.69C12.7 12.27 12.97 11.9 13.36 11.76C14.9 11.2 16 9.73 16 8C16 5.79 14.21 4 12 4Z"
				fill={filled ? 'currentColor' : 'none'}
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			{filled && (
				<path
					d="M10.6 8.2L11.6 9.5L13.4 7.2"
					stroke="white"
					stroke-width="1.4"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			)}
		</svg>
	)
}

export function QueenFinderIcon({ size = MOBILE_NAV_ICON_SIZE, filled = false }) {
	const bodyFill = filled ? 'currentColor' : 'none'
	const detailColor = filled ? 'white' : 'currentColor'

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle cx="10" cy="10" r="6" stroke="currentColor" stroke-width="2" />
			<path
				d="M14.5 14.5L20 20"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<path
				d="M8.2 9.2C6.7 8.2 6.7 6.4 8.1 6.2C9.2 6.1 9.8 7.3 10 8.8"
				fill={bodyFill}
				fill-opacity={filled ? '0.24' : '1'}
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linejoin="round"
			/>
			<path
				d="M11.8 9.2C13.3 8.2 13.3 6.4 11.9 6.2C10.8 6.1 10.2 7.3 10 8.8"
				fill={bodyFill}
				fill-opacity={filled ? '0.24' : '1'}
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linejoin="round"
			/>
			<ellipse
				cx="10"
				cy="10.9"
				rx="2.35"
				ry="3.35"
				fill={bodyFill}
				stroke="currentColor"
				stroke-width="1.6"
			/>
			<path
				d="M8 10.3H12"
				stroke={detailColor}
				stroke-width="1.2"
				stroke-linecap="round"
			/>
			<path
				d="M8.3 12.1H11.7"
				stroke={detailColor}
				stroke-width="1.2"
				stroke-linecap="round"
			/>
			<path
				d="M8.7 7.1L7.7 6"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
			/>
			<path
				d="M11.3 7.1L12.3 6"
				stroke="currentColor"
				stroke-width="1.4"
				stroke-linecap="round"
			/>
		</svg>
	)
}

export function BearFaceIcon({ size = MOBILE_NAV_ICON_SIZE }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle
				cx="6.5"
				cy="7.5"
				r="2.5"
				stroke="currentColor"
				stroke-width="2"
			/>
			<circle
				cx="17.5"
				cy="7.5"
				r="2.5"
				stroke="currentColor"
				stroke-width="2"
			/>
			<circle cx="12" cy="13" r="6.5" stroke="currentColor" stroke-width="2" />
			<path
				d="M8.1 11.5L10.1 10.8"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
			/>
			<path
				d="M15.9 11.5L13.9 10.8"
				stroke="currentColor"
				stroke-width="1.8"
				stroke-linecap="round"
			/>
			<circle cx="9.5" cy="12.8" r="0.95" fill="currentColor" />
			<circle cx="14.5" cy="12.8" r="0.95" fill="currentColor" />
			<path d="M12 13.9 L10.7 15.5 H13.3 Z" fill="currentColor" />
			<path
				d="M9.9 16.1C10.6 15.5 11.4 15.2 12 15.2C12.6 15.2 13.4 15.5 14.1 16.1"
				stroke="currentColor"
				stroke-width="1.7"
				stroke-linecap="round"
			/>
			<path
				d="M11.2 16.1L11.55 17.1L11.9 16.1"
				stroke="currentColor"
				stroke-width="1.3"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M12.1 16.1L12.45 17.1L12.8 16.1"
				stroke="currentColor"
				stroke-width="1.3"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	)
}

export function AIAdvisorIcon({ size = MOBILE_NAV_ICON_SIZE }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="6"
				y="5.5"
				width="12"
				height="11"
				rx="3"
				stroke="currentColor"
				stroke-width="2"
			/>
			<path
				d="M9.5 19H14.5"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<circle cx="10" cy="11" r="1.1" fill="currentColor" />
			<circle cx="14" cy="11" r="1.1" fill="currentColor" />
			<path
				d="M10.2 14.1C10.9 14.6 11.4 14.8 12 14.8C12.6 14.8 13.1 14.6 13.8 14.1"
				stroke="currentColor"
				stroke-width="1.7"
				stroke-linecap="round"
			/>
			<path
				d="M9 5.5V4.5"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<path
				d="M15 5.5V4.5"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
		</svg>
	)
}

export function WarehouseIcon({ size = MOBILE_NAV_ICON_SIZE, filled = false }) {
	const bodyFill = filled ? 'currentColor' : 'none'
	const detailColor = filled ? 'white' : 'currentColor'

	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M4 10.5L12 6L20 10.5V18.5C20 19.05 19.55 19.5 19 19.5H5C4.45 19.5 4 19.05 4 18.5V10.5Z"
				fill={bodyFill}
				stroke="currentColor"
				stroke-width="2"
				stroke-linejoin="round"
			/>
			<path
				d="M4 10.5L12 15L20 10.5"
				stroke={detailColor}
				stroke-width="2"
				stroke-linejoin="round"
			/>
			<path
				d="M12 15V19.5"
				stroke={detailColor}
				stroke-width="2"
				stroke-linecap="round"
			/>
		</svg>
	)
}

export function QueensIcon({ size = MOBILE_NAV_ICON_SIZE, filled = false }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M5 18.5H19"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<path
				d="M6.5 18.5L8.5 9.5L12 13L15.5 9.5L17.5 18.5"
				fill={filled ? 'currentColor' : 'none'}
				stroke="currentColor"
				stroke-width="2"
				stroke-linejoin="round"
			/>
			<circle
				cx="8.5"
				cy="7.5"
				r="1.5"
				fill={filled ? 'currentColor' : 'none'}
				stroke="currentColor"
				stroke-width="2"
			/>
			<circle
				cx="12"
				cy="5.5"
				r="1.5"
				fill={filled ? 'currentColor' : 'none'}
				stroke="currentColor"
				stroke-width="2"
			/>
			<circle
				cx="15.5"
				cy="7.5"
				r="1.5"
				fill={filled ? 'currentColor' : 'none'}
				stroke="currentColor"
				stroke-width="2"
			/>
		</svg>
	)
}

export function DeviceSignalIcon({ size = MOBILE_NAV_ICON_SIZE }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<rect
				x="4.5"
				y="7"
				width="10"
				height="12"
				rx="2.2"
				stroke="currentColor"
				stroke-width="2"
			/>
			<circle cx="9.5" cy="16" r="1.1" fill="currentColor" />
			<path
				d="M17 9.2C18.6 10.8 18.6 13.4 17 15"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<path
				d="M19.6 6.6C22.6 9.6 22.6 14.4 19.6 17.4"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
		</svg>
	)
}

export function SupportIcon({ size = MOBILE_NAV_ICON_SIZE }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M6 9.5C6 6.46 8.46 4 11.5 4H12.5C15.54 4 18 6.46 18 9.5V11.5C18 12.33 17.33 13 16.5 13H15V10.5C15 9.67 14.33 9 13.5 9H10.5C9.67 9 9 9.67 9 10.5V13H7.5C6.67 13 6 12.33 6 11.5V9.5Z"
				stroke="currentColor"
				stroke-width="2"
				stroke-linejoin="round"
			/>
			<path
				d="M12 13V15.5C12 17.43 10.43 19 8.5 19H8"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<rect
				x="5.5"
				y="8.5"
				width="2.5"
				height="6"
				rx="1.2"
				stroke="currentColor"
				stroke-width="1.8"
			/>
			<rect
				x="16"
				y="8.5"
				width="2.5"
				height="6"
				rx="1.2"
				stroke="currentColor"
				stroke-width="1.8"
			/>
		</svg>
	)
}

export function LogoutIcon({ size = MOBILE_NAV_ICON_SIZE }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M10 4H6.5C5.67 4 5 4.67 5 5.5V18.5C5 19.33 5.67 20 6.5 20H10"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<path
				d="M13 16L17 12L13 8"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
			<path
				d="M9 12H17"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
			/>
		</svg>
	)
}
