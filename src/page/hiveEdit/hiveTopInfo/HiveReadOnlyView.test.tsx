import { render as renderPreact } from 'preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import HiveReadOnlyView from './HiveReadOnlyView'

vi.mock('@/shared/translate', () => ({
	default: ({ children }: { children: any }) => children,
}))

vi.mock('@/shared/hive', () => ({
	default: () => <span>hive-icon</span>,
}))

vi.mock('@/shared/beeCounter', () => ({
	default: ({ count }: { count?: number }) => <span>{count ?? 0}</span>,
}))

vi.mock('@/icons/qrCodeIcon', () => ({
	default: () => <span>qr-icon</span>,
}))

vi.mock('@/icons/SkullIcon', () => ({
	default: () => <span>skull-icon</span>,
}))

vi.mock('@/shared/dateFormat', () => ({
	default: () => <span>date</span>,
}))

vi.mock('@/models/hive', () => ({
	isCollapsed: () => false,
}))

vi.mock('@/page/hiveEdit/hiveTopInfo/QueenSlot', () => ({
	default: () => <div>queen-slot</div>,
}))

vi.mock('@/page/hiveEdit/hiveStatistics', () => ({
	default: () => <div>hive-stats</div>,
}))

vi.mock('@/page/hiveEdit/hiveTopInfo/HivePlacementMiniMap', () => ({
	default: () => <div>mini-map</div>,
}))

const baseProps = {
	hive: { hiveNumber: 685, beeCount: 12, notes: '' },
	boxes: [],
	families: [],
	apiaryId: '524',
	hiveId: '685',
	buttons: <div>mobile-buttons</div>,
	buttonsDesktop: <div>desktop-buttons</div>,
	displayedBoxSystem: { name: 'Langstroth' },
	displayedBoxSystemColor: '#6b7280',
	isHorizontalHive: false,
	isHiveMiniMapLocked: true,
	isMobileApiary: true,
	hiveCreatedIconRef: { current: null },
	onGoToHiveView: vi.fn(),
	onNavigateToQueenLastSeen: vi.fn(),
	onEmptyQueenSlotClick: vi.fn(),
}

describe('HiveReadOnlyView QR button', () => {
	let container: HTMLDivElement

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		renderPreact(null, container)
		container.remove()
		vi.clearAllMocks()
	})

	it('calls onGenerateQR when the title QR button is clicked', () => {
		const onGenerateQR = vi.fn()

		renderPreact(
			<HiveReadOnlyView {...baseProps} onGenerateQR={onGenerateQR} />,
			container
		)

		const qrButton = container.querySelector(
			'button[aria-label="Generate QR sticker for this hive"]'
		)
		expect(qrButton).not.toBeNull()

		qrButton?.dispatchEvent(
			new MouseEvent('click', { bubbles: true, cancelable: true })
		)

		expect(onGenerateQR).toHaveBeenCalledTimes(1)
	})
})
