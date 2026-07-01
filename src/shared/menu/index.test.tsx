// @ts-nocheck
import { render as renderPreact } from 'preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Menu from './index'

vi.mock('react-router-dom', () => ({
	NavLink: ({ children, className, end, to, ...props }) => (
		<a
			className={typeof className === 'function' ? className({ isActive: to === '/apiaries' }) : className}
			href={to}
			{...props}
		>
			{children}
		</a>
	),
	useLocation: () => ({ pathname: '/apiaries', search: '' }),
	useNavigate: () => vi.fn(),
}))

vi.mock('@/shared/translate', () => ({
	default: ({ children }) => children,
}))

vi.mock('@/shared/avatar', () => ({
	default: () => <img alt="avatar" />,
}))

vi.mock('@/shared/header', () => ({
	default: ({ className = '', logoSrc = '', onLogoClick }) => (
		<nav className={className}>
			<a href="/apiaries" onClick={onLogoClick}>
				<img src={logoSrc} alt="Gratheon" />
			</a>
		</nav>
	),
}))

vi.mock('@/models/user', () => ({
	getUser: vi.fn(async () => ({ billingPlan: 'professional' })),
}))

vi.mock('dexie-react-hooks', () => ({
	useLiveQuery: () => ({ billingPlan: 'professional' }),
}))

describe('Menu', () => {
	let container: HTMLDivElement

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		renderPreact(null, container)
		container.remove()
	})

	it('renders desktop navigation when logged in and sidebar is expanded', () => {
		renderPreact(
			<Menu
				isLoggedIn={true}
				isSidebarCollapsed={false}
				onSidebarToggle={() => {}}
			/>,
			container
		)

		expect(container.innerHTML).toContain('Hives')
		expect(container.innerHTML).toContain('Account')
		expect(container.querySelector('nav')).toBeInTheDocument()
	})
})
