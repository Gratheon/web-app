import { render as renderPreact } from 'preact'
import { act } from 'preact/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import EventApiStatus from './index'

function createMockGraphqlWsClient() {
	const listeners: Record<string, Array<() => void>> = {}

	return {
		on(event: string, listener: () => void) {
			listeners[event] = listeners[event] || []
			listeners[event].push(listener)
			return () => {
				listeners[event] = listeners[event].filter((item) => item !== listener)
			}
		},
		emit(event: string) {
			;(listeners[event] || []).forEach((listener) => listener())
		},
		listenerCount(event: string) {
			return listeners[event]?.length || 0
		},
	}
}

describe('EventApiStatus', () => {
	let container: HTMLDivElement

	beforeEach(() => {
		container = document.createElement('div')
		document.body.appendChild(container)
	})

	afterEach(() => {
		renderPreact(null, container)
		container.remove()
	})

	it('renders the Event API status heading and unknown state by default', () => {
		act(() => {
			renderPreact(<EventApiStatus graphqlWsClient={createMockGraphqlWsClient()} />, container)
		})

		expect(container.textContent).toContain('Event API status')
		expect(container.textContent).toContain('Unknown')
		expect(container.querySelector('[data-status="unknown"]')).not.toBeNull()
	})

	it('updates the indicator when the websocket client reports connection changes', () => {
		const graphqlWsClient = createMockGraphqlWsClient()
		act(() => {
			renderPreact(<EventApiStatus graphqlWsClient={graphqlWsClient} />, container)
		})

		act(() => {
			graphqlWsClient.emit('connected')
		})
		expect(container.textContent).toContain('Connected')
		expect(container.querySelector('[data-status="green"]')).not.toBeNull()

		act(() => {
			graphqlWsClient.emit('closed')
		})
		expect(container.textContent).toContain('Disconnected')
		expect(container.querySelector('[data-status="red"]')).not.toBeNull()

		act(() => {
			graphqlWsClient.emit('error')
		})
		expect(container.textContent).toContain('Error')
		expect(container.querySelector('[data-status="orange"]')).not.toBeNull()
	})

	it('unsubscribes from websocket events on unmount', () => {
		const graphqlWsClient = createMockGraphqlWsClient()
		act(() => {
			renderPreact(<EventApiStatus graphqlWsClient={graphqlWsClient} />, container)
		})

		expect(graphqlWsClient.listenerCount('connected')).toBe(1)

		act(() => {
			renderPreact(null, container)
		})

		expect(graphqlWsClient.listenerCount('connected')).toBe(0)
		expect(graphqlWsClient.listenerCount('closed')).toBe(0)
		expect(graphqlWsClient.listenerCount('error')).toBe(0)
	})
})
