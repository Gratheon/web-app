import { render as renderPreact } from 'preact'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import styles from './queens.module.less'
import WarehouseQueensPage from './queens'

const mocks = vi.hoisted(() => ({
	useQuery: vi.fn(),
	useMutation: vi.fn(),
	useLiveQuery: vi.fn(),
}))

function setMobileLayout(matches: boolean) {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation(() => ({
			matches,
			media: '(max-width: 576px)',
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	})
}

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
	default: ({ error }: { error?: any }) => {
		if (!error) return null
		return <div>{typeof error === 'string' ? error : error.message}</div>
	},
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
		setMobileLayout(false)
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

	it('hides view selector and keeps list layout on mobile', () => {
		setMobileLayout(true)
		mocks.useQuery.mockReturnValue({
			data: {
				warehouseQueens: [
					{
						id: '55',
						name: 'Aphrodite',
						added: '2026',
						color: '#fefee3',
						race: 'Carniolan',
					},
				],
			},
			loading: false,
			error: null,
			reexecuteQuery: vi.fn(),
		})
		mocks.useLiveQuery
			.mockReturnValueOnce([])
			.mockReturnValueOnce([])
			.mockReturnValueOnce([])
			.mockReturnValueOnce([])
			.mockReturnValueOnce([])
			.mockReturnValue([])

		const container = document.createElement('div')
		document.body.appendChild(container)
		renderPreact(<WarehouseQueensPage />, container)

		expect(container.textContent).not.toContain('list-icon')
		expect(container.textContent).not.toContain('table-icon')
		expect(container.querySelector('table')).toBeNull()
		expect(container.querySelector(`.${styles.card}`)).not.toBeNull()

		renderPreact(null, container)
		container.remove()
	})

	it('reveals mobile swipe delete and hides the row optimistically', async () => {
		setMobileLayout(true)
		const deleteWarehouseQueen = vi.fn().mockResolvedValue({ data: { deleteWarehouseQueen: true } })
		const reexecuteQuery = vi.fn()
		mocks.useMutation.mockReturnValue([deleteWarehouseQueen])
		mocks.useQuery.mockReturnValue({
			data: {
				warehouseQueens: [
					{
						id: '55',
						name: 'Aphrodite',
						added: '2026',
						color: '#fefee3',
						race: 'Carniolan',
					},
				],
			},
			loading: false,
			error: null,
			reexecuteQuery,
		})
		mocks.useLiveQuery
			.mockReturnValueOnce([])
			.mockReturnValueOnce([])
			.mockReturnValueOnce([])
			.mockReturnValueOnce([])
			.mockReturnValueOnce([])
			.mockReturnValue([])

		const container = document.createElement('div')
		document.body.appendChild(container)
		renderPreact(<WarehouseQueensPage />, container)

		const card = container.querySelector(`.${styles.swipeCard}`) as HTMLElement | null
		expect(card).not.toBeNull()

		const touchStart = new Event('touchstart', { bubbles: true })
		Object.defineProperty(touchStart, 'touches', { value: [{ clientX: 180, clientY: 20 }] })
		card?.dispatchEvent(touchStart)
		const touchEnd = new Event('touchend', { bubbles: true })
		Object.defineProperty(touchEnd, 'changedTouches', { value: [{ clientX: 90, clientY: 24 }] })
		card?.dispatchEvent(touchEnd)
		await Promise.resolve()

		const deleteButton = container.querySelector('button[aria-label="Delete Aphrodite"]') as HTMLButtonElement | null
		expect(deleteButton).not.toBeNull()
		deleteButton?.click()
		await Promise.resolve()

		expect(container.textContent).not.toContain('Aphrodite')
		expect(container.textContent).not.toContain('Deleting...')
		expect(deleteWarehouseQueen).toHaveBeenCalledWith({ familyId: '55' })
		expect(reexecuteQuery).toHaveBeenCalledWith({ requestPolicy: 'network-only' })

		renderPreact(null, container)
		container.remove()
	})

	it('restores the row and shows an error when optimistic delete fails', async () => {
		setMobileLayout(true)
		const deleteWarehouseQueen = vi.fn().mockResolvedValue({
			data: { deleteWarehouseQueen: false },
			error: new Error('Delete failed'),
		})
		mocks.useMutation.mockReturnValue([deleteWarehouseQueen])
		mocks.useQuery.mockReturnValue({
			data: {
				warehouseQueens: [
					{
						id: '55',
						name: 'Aphrodite',
						added: '2026',
						color: '#fefee3',
						race: 'Carniolan',
					},
				],
			},
			loading: false,
			error: null,
			reexecuteQuery: vi.fn(),
		})
		mocks.useLiveQuery
			.mockReturnValueOnce([])
			.mockReturnValueOnce([])
			.mockReturnValueOnce([])
			.mockReturnValueOnce([])
			.mockReturnValueOnce([])
			.mockReturnValue([])

		const container = document.createElement('div')
		document.body.appendChild(container)
		renderPreact(<WarehouseQueensPage />, container)

		const card = container.querySelector(`.${styles.swipeCard}`) as HTMLElement | null
		const touchStart = new Event('touchstart', { bubbles: true })
		Object.defineProperty(touchStart, 'touches', { value: [{ clientX: 180, clientY: 20 }] })
		card?.dispatchEvent(touchStart)
		const touchEnd = new Event('touchend', { bubbles: true })
		Object.defineProperty(touchEnd, 'changedTouches', { value: [{ clientX: 90, clientY: 24 }] })
		card?.dispatchEvent(touchEnd)
		await Promise.resolve()

		const deleteButton = container.querySelector('button[aria-label="Delete Aphrodite"]') as HTMLButtonElement | null
		deleteButton?.click()
		await Promise.resolve()
		await Promise.resolve()
		await new Promise((resolve) => setTimeout(resolve, 0))

		expect(deleteWarehouseQueen).toHaveBeenCalledWith({ familyId: '55' })
		expect(container.textContent).toContain('Aphrodite')
		expect(container.textContent).toContain('Delete failed')

		renderPreact(null, container)
		container.remove()
	})


	it('allows starting a second mobile delete while the first request is still pending', async () => {
		setMobileLayout(true)
		let resolveFirst: ((value: any) => void) | null = null
		const firstPromise = new Promise((resolve) => {
			resolveFirst = resolve
		})
		const deleteWarehouseQueen = vi.fn()
		deleteWarehouseQueen
			.mockImplementationOnce(() => firstPromise)
			.mockResolvedValueOnce({ data: { deleteWarehouseQueen: true } })
		const reexecuteQuery = vi.fn()
		mocks.useMutation.mockReturnValue([deleteWarehouseQueen])
		mocks.useQuery.mockReturnValue({
			data: {
				warehouseQueens: [
					{ id: '55', name: 'Aphrodite', added: '2026', color: '#fefee3', race: 'Carniolan' },
					{ id: '56', name: 'Artemis', added: '2025', color: '#ffffff', race: 'Buckfast' },
				],
			},
			loading: false,
			error: null,
			reexecuteQuery,
		})
		mocks.useLiveQuery
			.mockReturnValueOnce([])
			.mockReturnValueOnce([])
			.mockReturnValueOnce([])
			.mockReturnValueOnce([])
			.mockReturnValueOnce([])
			.mockReturnValue([])

		const container = document.createElement('div')
		document.body.appendChild(container)
		renderPreact(<WarehouseQueensPage />, container)

		const cards = container.querySelectorAll(`.${styles.swipeCard}`)
		const firstCard = cards[0] as HTMLElement | undefined
		const secondCard = cards[1] as HTMLElement | undefined
		expect(firstCard).toBeTruthy()
		expect(secondCard).toBeTruthy()

		const swipe = async (card: HTMLElement | undefined) => {
			if (!card) return
			const touchStart = new Event('touchstart', { bubbles: true })
			Object.defineProperty(touchStart, 'touches', { value: [{ clientX: 180, clientY: 20 }] })
			card.dispatchEvent(touchStart)
			const touchEnd = new Event('touchend', { bubbles: true })
			Object.defineProperty(touchEnd, 'changedTouches', { value: [{ clientX: 90, clientY: 24 }] })
			card.dispatchEvent(touchEnd)
			await Promise.resolve()
		}

		await swipe(firstCard)
		;(container.querySelector('button[aria-label="Delete Aphrodite"]') as HTMLButtonElement | null)?.click()
		await Promise.resolve()
		expect(container.textContent).not.toContain('Aphrodite')

		await swipe(secondCard)
		;(container.querySelector('button[aria-label="Delete Artemis"]') as HTMLButtonElement | null)?.click()
		await Promise.resolve()
		expect(container.textContent).not.toContain('Artemis')
		expect(deleteWarehouseQueen).toHaveBeenCalledTimes(2)
		expect(deleteWarehouseQueen).toHaveBeenNthCalledWith(1, { familyId: '55' })
		expect(deleteWarehouseQueen).toHaveBeenNthCalledWith(2, { familyId: '56' })

		resolveFirst?.({ data: { deleteWarehouseQueen: true } })
		await Promise.resolve()
		await Promise.resolve()

		renderPreact(null, container)
		container.remove()
	})

})
