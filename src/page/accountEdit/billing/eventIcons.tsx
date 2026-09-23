import type { ReactNode } from 'react'

const ICON_SIZE = 14

function StrokeIcon({ children }: { children: ReactNode }) {
	return (
		<svg
			width={ICON_SIZE}
			height={ICON_SIZE}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<g
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				{children}
			</g>
		</svg>
	)
}

function UserIcon() {
	return (
		<StrokeIcon>
			<circle cx="12" cy="8" r="3.5" />
			<path d="M5 19c0-3.3 3.1-6 7-6s7 2.7 7 6" />
		</StrokeIcon>
	)
}

function CheckIcon() {
	return (
		<StrokeIcon>
			<path d="M5 12.5l5 5L20 7" />
		</StrokeIcon>
	)
}

function CrossIcon() {
	return (
		<StrokeIcon>
			<path d="M6 6l12 12M18 6L6 18" />
		</StrokeIcon>
	)
}

function ClockIcon() {
	return (
		<StrokeIcon>
			<circle cx="12" cy="12" r="8" />
			<path d="M12 8v4.5l3 2" />
		</StrokeIcon>
	)
}

function RefreshIcon() {
	return (
		<StrokeIcon>
			<path d="M20 12a8 8 0 1 1-2.2-5.5" />
			<path d="M20 4v6h-6" />
		</StrokeIcon>
	)
}

function CardIcon() {
	return (
		<StrokeIcon>
			<rect x="3" y="6" width="18" height="12" rx="2" />
			<path d="M3 10h18M7 15h4" />
		</StrokeIcon>
	)
}

function WarnIcon() {
	return (
		<StrokeIcon>
			<path d="M12 4l9 16H3L12 4z" />
			<path d="M12 10v4M12 16.5v.5" />
		</StrokeIcon>
	)
}

function DotIcon() {
	return (
		<svg
			width={ICON_SIZE}
			height={ICON_SIZE}
			viewBox="0 0 24 24"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<circle cx="12" cy="12" r="3" />
		</svg>
	)
}

const EVENT_ICONS: Record<string, () => ReactNode> = {
	registration: UserIcon,
	subscription_created: CheckIcon,
	subscription_cancelled: CrossIcon,
	subscription_expired: ClockIcon,
	tier_changed: RefreshIcon,
	payment_succeeded: CardIcon,
	payment_failed: WarnIcon,
}

export function BillingEventIcon({ eventType }: { eventType: string }) {
	const Icon = EVENT_ICONS[eventType] || DotIcon
	return <Icon />
}
