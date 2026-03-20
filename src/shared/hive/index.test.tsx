import { describe, expect, it, vi } from 'vitest'
import { render as renderPreact } from 'preact'
import { gateWidthByHoleCount, shouldRenderGateLine } from './index'
import HiveIcon from './index'
import styles from './index.module.less'

vi.mock('react-color/es/Github', () => ({
	default: () => null,
}))

describe('gateWidthByHoleCount', () => {
	it('returns zero width for zero holes', () => {
		expect(gateWidthByHoleCount(0)).toBe('0%')
	})

	it('returns small proportional width for one hole', () => {
		expect(gateWidthByHoleCount(1)).toBe('6%')
	})

	it('returns max width for fully open entrance', () => {
		expect(gateWidthByHoleCount(16)).toBe('92%')
	})

	it('normalizes invalid values to default hole count', () => {
		expect(gateWidthByHoleCount(undefined)).toBe('46%')
		expect(gateWidthByHoleCount('abc')).toBe('46%')
	})
})

describe('shouldRenderGateLine', () => {
	it('returns false for zero holes', () => {
		expect(shouldRenderGateLine(0)).toBe(false)
	})

	it('returns true for non-zero hole counts', () => {
		expect(shouldRenderGateLine(1)).toBe(true)
		expect(shouldRenderGateLine(16)).toBe(true)
	})
})

describe('HiveIcon', () => {
	it('does not render gate line when holeCount is zero', () => {
		const container = document.createElement('div')
		document.body.appendChild(container)

		renderPreact(
			<HiveIcon boxes={[{ id: 1, type: 'GATE', position: 0, holeCount: 0 }]} />,
			container
		)

		expect(container.querySelector(`.${styles.gate}`)).toBeNull()
		renderPreact(null, container)
		container.remove()
	})

	it('renders gate line with proportional width when holeCount is positive', () => {
		const container = document.createElement('div')
		document.body.appendChild(container)

		renderPreact(
			<HiveIcon boxes={[{ id: 1, type: 'GATE', position: 0, holeCount: 1 }]} />,
			container
		)

		const gate = container.querySelector(`.${styles.gate}`) as HTMLDivElement | null
		expect(gate).not.toBeNull()
		expect(gate?.style.width).toBe('6%')
		renderPreact(null, container)
		container.remove()
	})

	it('renders mixed hive box types without crashing', () => {
		const container = document.createElement('div')
		document.body.appendChild(container)

		renderPreact(
			<HiveIcon
				size={80}
				boxes={[
					{ id: 1, type: 'ROOF', position: 7 },
					{ id: 2, type: 'DEEP', position: 6, color: '#aaa' },
					{ id: 3, type: 'SUPER', position: 5, color: '#bbb' },
					{ id: 4, type: 'HORIZONTAL_FEEDER', position: 4 },
					{ id: 5, type: 'QUEEN_EXCLUDER', position: 3 },
					{ id: 6, type: 'VENTILATION', position: 2 },
					{ id: 7, type: 'GATE', position: 1, holeCount: 16 },
					{ id: 8, type: 'BOTTOM', position: 0 },
				]}
			/>,
			container
		)

		expect(container.querySelector(`.${styles.roof}`)).not.toBeNull()
		expect(container.querySelector(`.${styles.ventilation}`)).not.toBeNull()
		expect(container.querySelectorAll(`.${styles.gripNotch}`).length).toBe(2)
		renderPreact(null, container)
		container.remove()
	})
})
