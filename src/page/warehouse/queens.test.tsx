import { render as renderPreact } from 'preact'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import styles from './queens.module.less'
import WarehouseQueensPage from './queens'

const mocks = vi.hoisted(() => ({
	useQuery: vi.fn(),
	useMutation: vi.fn(),
	useLiveQuery: vi.fn(),
}))

vi.mock('@/api', () => ({
	gql: (template: TemplateStringsArray) => template.join(''),
	useQuery: (...args: unknown[]) => mocks.useQuery(...args),
	useMutation: (...args: unknown[]) => mocks.useMutation(...args),
}))

vi.mock('dexie-react-hooks', () => ({
	useLiveQuery: (...args: unknown[]) => mocks.useLiveQuery(...args),
}))

vi.mock('@/shared/translate', () => ({
	default: ({ children }: { children: string }) => children,
}))

vi.mock('react-router-dom', () => ({
	Link: ({ children, to }: { children: any, to: string }) => <a href={to}>{children}</a>,
}))

vi.mock('@/shared/button', () => ({
	default: ({
		children,
		href,
		onClick,
	}: {
		children: any
		href?: string
		onClick?: () => void
	}) => (href ? <a href={href}>{children}</a> : <button onClick={onClick}>{children}</button>),
}))

vi.mock('@/shared/messageError', () => ({
	default: () => null,
}))

vi.mock('@/shared/loader', () => ({
	default: () => <div>loading</div>,
}))

vi.mock('@/shared/modal', () => ({
	default: ({ children }: { children: any }) => <div>{children}</div>,
}))

vi.mock('@/icons/listIcon', () => ({
	default: () => <span>list-icon</span>,
}))

vi.mock('@/icons/tableIcon', () => ({
	default: () => <span>table-icon</span>,
}))

describe('WarehouseQueensPage', () => {
	beforeEach(() => {
		mocks.useQuery.mockReset()
		mocks.useMutation.mockReset()
		mocks.useLiveQuery.mockReset()

		mocks.useMutation.mockReturnValue([vi.fn()])
		mocks.useQuery.mockReturnValue({
			data: {
				warehouseQueens: [],
			},
			loading: false,
			error: null,
			reexecuteQuery: vi.fn(),
		})
	})

	it('shows preview hint and "Not marked yet" for queens without frame marker', () => {
		mocks.useLiveQuery
			.mockReturnValueOnce([
				{
					id: '1',
					name: 'Hera',
					added: '2024',
					color: '#ffffff',
					hiveId: '10',
				},
			])
			.mockReturnValueOnce([])
			.mockReturnValueOnce([
				{
					id: '1',
					name: 'Hera',
					added: '2024',
					color: '#ffffff',
					hiveId: '10',
				},
			])
			.mockReturnValueOnce([
				{
					id: '10',
					apiaryId: '100',
					hiveNumber: 3,
				},
			])
			.mockReturnValueOnce([])
			.mockReturnValue([])

		const container = document.createElement('div')
		document.body.appendChild(container)
		renderPreact(<WarehouseQueensPage />, container)

		expect(container.textContent).toContain('Tip: mark the queen on a frame in canvas view, and that marked area will be shown here as the queen preview image.')
		expect(container.textContent).toContain('Last detected frame:')
		expect(container.textContent).toContain('Not marked yet')

		renderPreact(null, container)
		container.remove()
	})

	it('renders real preview as styled preview image and fallback as placeholder image', () => {
		mocks.useLiveQuery
			.mockReturnValueOnce([
				{
					id: '1',
					name: 'Athena',
					added: '2024',
					color: '#ff6600',
					hiveId: '10',
					previewImageUrl: 'https://example.com/athena.jpg',
					lastSeenFrameId: '4',
					lastSeenFrameSideId: '8',
					lastSeenBoxId: '12',
				},
				{
					id: '2',
					name: 'Hera',
					added: '2023',
					color: '#00aa88',
					hiveId: '11',
				},
			])
			.mockReturnValueOnce([])
			.mockReturnValueOnce([
				{
					id: '1',
					name: 'Athena',
					added: '2024',
					color: '#ff6600',
					hiveId: '10',
					previewImageUrl: 'https://example.com/athena.jpg',
					lastSeenFrameId: '4',
					lastSeenFrameSideId: '8',
					lastSeenBoxId: '12',
				},
				{
					id: '2',
					name: 'Hera',
					added: '2023',
					color: '#00aa88',
					hiveId: '11',
				},
			])
			.mockReturnValueOnce([
				{
					id: '10',
					apiaryId: '100',
					hiveNumber: 3,
				},
				{
					id: '11',
					apiaryId: '100',
					hiveNumber: 4,
				},
			])
			.mockReturnValueOnce([])
			.mockReturnValue([])

		const container = document.createElement('div')
		document.body.appendChild(container)
		renderPreact(<WarehouseQueensPage />, container)

		const previewImage = container.querySelector('img[alt="Athena"]') as HTMLImageElement | null
		const placeholderImage = container.querySelector('img[alt="Hera"]') as HTMLImageElement | null

		expect(previewImage).not.toBeNull()
		expect(previewImage?.classList.contains(styles.cardImagePreview)).toBe(true)
		expect(previewImage?.classList.contains(styles.cardImagePlaceholder)).toBe(false)
		expect(previewImage?.style.borderColor).toBe('rgb(255, 102, 0)')

		expect(placeholderImage).not.toBeNull()
		expect(placeholderImage?.classList.contains(styles.cardImagePlaceholder)).toBe(true)
		expect(placeholderImage?.classList.contains(styles.cardImagePreview)).toBe(false)
		expect(container.textContent).toContain('Open frame')

		renderPreact(null, container)
		container.remove()
	})
})
