import { render as renderPreact } from 'preact'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import TrashIcon from '@/icons/trashIcon'
import logsStyles from '@/page/hiveEdit/logs/styles.module.less'

import Button from './index'
import styles from './index.module.less'

vi.mock('react-router-dom', () => ({
	useNavigate: () => vi.fn(),
}))

vi.mock('../loader', () => ({
	default: () => <span>loader</span>,
}))

describe('Button iconOnly', () => {
	let container: HTMLDivElement

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		renderPreact(null, container)
		container.remove()
	})

	it('renders trash icon markup for small red log delete buttons', () => {
		renderPreact(
			<Button
				color="red"
				size="small"
				iconOnly
				className={logsStyles.deleteButton}
				title="Delete entry"
			>
				<TrashIcon size={16} />
			</Button>,
			container
		)

		const button = container.querySelector('button')
		const svg = container.querySelector('svg')

		expect(button).not.toBeNull()
		expect(svg).not.toBeNull()
		expect(button?.className.split(/\s+/)).toEqual(
			expect.arrayContaining([
				styles.button,
				styles.red,
				styles.small,
				styles.iconOnly,
				logsStyles.deleteButton,
			])
		)
		expect(svg?.getAttribute('width')).toBe('16')
		expect(svg?.getAttribute('height')).toBe('16')
	})
})
