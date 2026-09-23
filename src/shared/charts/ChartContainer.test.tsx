import { render as renderPreact } from 'preact'
import { act } from 'preact/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ChartContainer from './ChartContainer'

vi.mock('lightweight-charts-react-components', () => ({
	Chart: ({ children }: { children: any }) => <div data-testid="chart">{children}</div>,
}))

vi.mock('@/shared/button', () => ({
	default: ({
		children,
		onClick,
	}: {
		children: any
		onClick?: () => void
	}) => <button onClick={onClick}>{children}</button>,
}))

vi.mock('@/shared/translate', () => ({
	default: ({ children }: { children: string }) => children,
}))

vi.mock('@/shared/chartHeading', () => ({
	default: ({ title }: { title: string }) => <h3>{title}</h3>,
}))

vi.mock('./AlertRulesPanel', () => ({
	default: () => null,
}))

describe('ChartContainer view toggle', () => {
	let container: HTMLDivElement

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
		class ResizeObserverMock {
			observe() {}
			unobserve() {}
			disconnect() {}
		}
		vi.stubGlobal('ResizeObserver', ResizeObserverMock)
	})

	afterEach(() => {
		renderPreact(null, container)
		container.remove()
		vi.unstubAllGlobals()
	})

	it('uses the shared compact switch to toggle chart and table views', () => {
		renderPreact(
			<ChartContainer
				title="Weight"
				showTable
				tableData={[
					{ label: 'Hive 1', value: 32 },
					{ label: 'Hive 2', value: 28 },
				]}
			>
				<span>series</span>
			</ChartContainer>,
			container,
		)

		const getToggle = () => container.querySelector('[role="switch"]') as HTMLButtonElement | null
		expect(getToggle()).not.toBeNull()
		expect(getToggle()?.className).toContain('compact')
		expect(getToggle()?.getAttribute('aria-label')).toBe('Switch between chart and table view')
		expect(getToggle()?.getAttribute('aria-checked')).toBe('false')
		expect(container.querySelector('[data-testid="chart"]')).not.toBeNull()
		expect(container.querySelector('table')).toBeNull()

		act(() => {
			getToggle()?.click()
		})

		expect(getToggle()?.getAttribute('aria-checked')).toBe('true')
		expect(container.querySelector('table')).not.toBeNull()
		expect(container.querySelector('[data-testid="chart"]')).toBeNull()

		act(() => {
			getToggle()?.click()
		})

		expect(getToggle()?.getAttribute('aria-checked')).toBe('false')
		expect(container.querySelector('[data-testid="chart"]')).not.toBeNull()
		expect(container.querySelector('table')).toBeNull()
	})
})
