import { render as renderPreact } from 'preact'
import { act } from 'react-dom/test-utils'
import { formatDateTimeByLocale } from '@/shared/dateLocale'
import styles from './styles.module.less'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CalendarPage from './index'

const calendarResponse = {
	range: {
		from: '2026-06-01T00:00:00.000Z',
		to: '2026-06-30T23:59:59.000Z',
		capped: false,
	},
	items: [
		{
			id: '1',
			kind: 'HISTORICAL_RECORD',
			sourceType: 'INSPECTION',
			date: '2026-06-15T12:00:00.000Z',
			label: { fallback: 'Inspection' },
			source: { apiaryId: 'a1', hiveId: 'h1', sourceId: 'i1' },
		},
	],
	inspectionRecency: [
		{
			hive: { id: 'h1', hiveNumber: 1 },
			latestAt: '2026-06-15T12:00:00.000Z',
			isInsideSelectedRange: true,
		},
	],
}

const mockUseQuery = vi.fn((_query?: any, _options?: any) => ({
	data: { calendar: calendarResponse },
	loading: false,
	error: null,
}))

vi.mock('react-router-dom', () => ({
	NavLink: ({
		children,
		className,
		to,
	}: {
		children: any
		className?: string
		to: string
	}) => (
		<a className={className} href={to}>
			{children}
		</a>
	),
	useNavigate: () => vi.fn(),
}))

vi.mock('@/api', () => ({
	gql: (strs: any) => strs[0],
	useQuery: (query: any, options?: any) => mockUseQuery(query, options),
}))

describe('CalendarPage', () => {
	let container: HTMLDivElement

	beforeEach(() => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date('2026-06-21T21:30:00.000Z'))
		mockUseQuery.mockReturnValue({
			data: { calendar: calendarResponse },
			loading: false,
			error: null,
		})
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		renderPreact(null, container)
		container.remove()
		vi.useRealTimers()
	})

	it('renders calendar header', () => {
		renderPreact(<CalendarPage />, container)
		expect(container.innerHTML).toContain('Calendar')
		expect(container.innerHTML).toContain('Historical hive activity')
	})

	it('places month navigation alongside the filters', () => {
		renderPreact(<CalendarPage />, container)

		const filters = container.querySelector(`.${styles.filters}`)
		const controls = container.querySelector(`.${styles.controls}`)

		expect(filters?.contains(controls)).toBe(true)
	})

	it('keeps chronology items and source links on the chronology tab', () => {
		renderPreact(<CalendarPage />, container)

		expect(container.innerHTML).toContain('Inspection')
		expect(container.innerHTML).not.toContain(
			'/apiaries/a1/hives/h1/inspections/i1'
		)

		const chronologyTab = container.querySelector(
			'#chronology-tab'
		) as HTMLButtonElement
		act(() => {
			chronologyTab.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		})

		expect(container.innerHTML).toContain('Chronology')
		expect(container.innerHTML).toContain(
			'/apiaries/a1/hives/h1/inspections/i1'
		)
	})

	it('renders recency display', () => {
		renderPreact(<CalendarPage />, container)
		expect(container.innerHTML).toContain('Inspection recency')
		expect(container.innerHTML).toContain('Hive')
		expect(container.innerHTML).toContain('1')
	})

	it('shows month labels when a new month starts in the grid', () => {
		renderPreact(<CalendarPage />, container)
		expect(container.innerHTML).toContain('1<span')
		expect(container.innerHTML).toContain('Jun')
		expect(container.innerHTML).toContain('Jul')
	})

	it('shows weekday columns in Saturday-first order and highlights weekend days', () => {
		renderPreact(<CalendarPage />, container)

		const weekdayHeaders = Array.from(
			container.querySelectorAll<HTMLElement>(
				`[aria-label="Calendar month grid"] .${styles.weekdayHeader}`
			)
		)
		const weekdayDates = Array.from(
			{ length: 7 },
			(_, index) => new Date(Date.UTC(2024, 0, 6 + index, 12))
		)
		expect(weekdayHeaders.map((header) => header.textContent)).toEqual(
			weekdayDates.map((date) =>
				formatDateTimeByLocale(date, { weekday: 'short', timeZone: 'UTC' })
			)
		)
		expect(
			weekdayHeaders.map((header) => header.querySelector('abbr')?.title)
		).toEqual(
			weekdayDates.map((date) =>
				formatDateTimeByLocale(date, { weekday: 'long', timeZone: 'UTC' })
			)
		)

		const days = Array.from(
			container.querySelectorAll<HTMLElement>(
				`[aria-label="Calendar month grid"] > .${styles.day}`
			)
		)
		expect(
			days.slice(0, 3).map((day) => day.querySelector('strong')?.textContent)
		).toEqual(['23', '24', '25'])
		expect(days[0].classList.contains(styles.weekend)).toBe(true)
		expect(days[1].classList.contains(styles.weekend)).toBe(true)
		expect(days[2].classList.contains(styles.weekend)).toBe(false)
	})

	it('does not render an empty records notice for an empty calendar', () => {
		mockUseQuery.mockReturnValue({
			data: { calendar: { ...calendarResponse, items: [] } },
			loading: false,
			error: null,
		})

		renderPreact(<CalendarPage />, container)
		expect(container.innerHTML).not.toContain('No calendar records found')
	})
})
