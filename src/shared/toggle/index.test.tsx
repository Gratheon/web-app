import { render as renderPreact } from 'preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Toggle from './index'

describe('Toggle', () => {
	let container: HTMLDivElement

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		renderPreact(null, container)
		container.remove()
	})

	it('exposes switch semantics for the current state', () => {
		renderPreact(
			<Toggle checked={false} onChange={vi.fn()} aria-label="View mode" />,
			container,
		)

		const toggle = container.querySelector('[role="switch"]')
		expect(toggle).not.toBeNull()
		expect(toggle?.getAttribute('aria-checked')).toBe('false')
		expect(toggle?.getAttribute('aria-label')).toBe('View mode')
	})

	it('notifies the next boolean state on click', () => {
		const onChange = vi.fn()
		renderPreact(<Toggle checked={false} onChange={onChange} />, container)

		container.querySelector('button')?.click()
		expect(onChange).toHaveBeenCalledWith(true)
	})

	it('applies compact sizing when requested', () => {
		renderPreact(
			<Toggle checked={false} size="compact" onChange={vi.fn()} />,
			container,
		)

		expect(container.querySelector('button')?.className).toContain('compact')
	})

	it('does not change state when disabled', () => {
		const onChange = vi.fn()
		renderPreact(
			<Toggle checked={true} disabled onChange={onChange} />,
			container,
		)

		container.querySelector('button')?.click()
		expect(onChange).not.toHaveBeenCalled()
	})
})
