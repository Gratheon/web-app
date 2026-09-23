import { render as renderPreact } from 'preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import Button from './index'
import styles from './index.module.less'

vi.mock('react-router-dom', () => ({
	useNavigate: () => vi.fn(),
}))

vi.mock('../loader', () => ({
	default: () => <span>loader</span>,
}))

describe('Button', () => {
	let container: HTMLDivElement

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		renderPreact(null, container)
		container.remove()
	})

	it('scopes 3D chrome to the button class instead of every native button', () => {
		renderPreact(
			<>
				<Button onClick={vi.fn()}>Save</Button>
				<button type="button">raw</button>
			</>,
			container
		)

		const [styledButton, rawButton] = Array.from(
			container.querySelectorAll('button')
		)

		expect(styledButton.className.split(/\s+/)).toContain(styles.button)
		expect(rawButton.className.split(/\s+/)).not.toContain(styles.button)
	})

	it('fires onClick for a regular press', () => {
		const onClick = vi.fn()
		renderPreact(<Button onClick={onClick}>Save</Button>, container)

		container.querySelector('button')?.click()
		expect(onClick).toHaveBeenCalledTimes(1)
	})
})
