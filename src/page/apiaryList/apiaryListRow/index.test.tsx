import { render as renderPreact } from 'preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ApiaryListRow from './index'

const mocks = vi.hoisted(() => ({
	dateTimeAgo: vi.fn(({ dateString, lang }: { dateString: string; lang?: string }) => (
		<span data-date-time-ago-lang={lang}>{dateString}</span>
	)),
}))

vi.mock('react-router-dom', () => ({
	NavLink: ({ children, className, to }: { children: any; className?: string; to: string }) => (
		<a className={className} href={to}>{children}</a>
	),
}))

vi.mock('../../../shared/hive', () => ({
	default: () => <span>hive-icon</span>,
}))

vi.mock('../../../shared/button', () => ({
	default: ({ children, href, onClick }: { children: any; href?: string; onClick?: () => void }) => (
		href ? <a href={href}>{children}</a> : <button onClick={onClick}>{children}</button>
	),
}))

vi.mock('../../../shared/hivesPlaceholder', () => ({
	default: () => <div>hives-placeholder</div>,
}))

vi.mock('../../../shared/translate', () => ({
	default: ({ children }: { children: any }) => children,
}))

vi.mock('../../../shared/beeCounter', () => ({
	default: ({ count }: { count?: number }) => <span>{count ?? 0}</span>,
}))

vi.mock('../../../shared/link', () => ({
	default: ({ children, href }: { children: any; href: string }) => <a href={href}>{children}</a>,
}))

vi.mock('../../../icons/hive.tsx', () => ({
	default: () => <span>add-hive-icon</span>,
}))

vi.mock('../../../icons/listIcon.tsx', () => ({
	default: () => <span>list-icon</span>,
}))

vi.mock('../../../icons/tableIcon.tsx', () => ({
	default: () => <span>table-icon</span>,
}))

vi.mock('../../../icons/staticTreeIcon.tsx', () => ({
	default: () => <span>static-apiary</span>,
}))

vi.mock('../../../icons/mobileTruckIcon.tsx', () => ({
	default: () => <span>mobile-apiary</span>,
}))

vi.mock('../../../shared/dateTimeAgo', () => ({
	default: (...args: Parameters<typeof mocks.dateTimeAgo>) => mocks.dateTimeAgo(...args),
}))

function setDesktopLayout() {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation(() => ({
			matches: false,
			media: '(max-width: 576px)',
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
		})),
	})
}

describe('ApiaryListRow', () => {
	let container: HTMLDivElement

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
		setDesktopLayout()
		mocks.dateTimeAgo.mockClear()
		Object.defineProperty(window.navigator, 'language', {
			configurable: true,
			value: 'et-EE',
		})
	})

	afterEach(() => {
		renderPreact(null, container)
		container.remove()
	})

	it('renders date columns while user is still null', () => {
		renderPreact(
			<ApiaryListRow
				apiary={{
					id: 1,
					name: 'North yard',
					type: 'STATIC',
					hives: [
						{
							id: 10,
							hiveNumber: 7,
							lastInspection: '2024-04-11',
							families: [
								{
									id: 100,
									name: 'Queen A',
									lastTreatment: '2024-04-01',
								},
							],
							boxes: [],
						},
					],
				}}
				boxSystems={[]}
				user={null}
				sortBy="HIVE_NUMBER"
				sortOrder="ASC"
				onSortChange={vi.fn()}
				visibleColumns={['LAST_TREATMENT', 'LAST_INSPECTION']}
				onToggleColumn={vi.fn()}
				selectedHiveApiaryId={null}
				selectedHiveId={null}
				onSelectHive={vi.fn()}
				onNavigateAcrossApiaries={vi.fn()}
				hasMixedApiaryTypes={false}
				forcedListType="table"
			/>,
			container,
		)

		expect(mocks.dateTimeAgo).toHaveBeenCalledTimes(2)
		expect(mocks.dateTimeAgo).toHaveBeenCalledWith(
			expect.objectContaining({ dateString: '2024-04-01', lang: 'et-EE' }),
			expect.anything(),
		)
		expect(mocks.dateTimeAgo).toHaveBeenCalledWith(
			expect.objectContaining({ dateString: '2024-04-11', lang: 'et-EE' }),
			expect.anything(),
		)
	})
})
