import 'fake-indexeddb/auto'
import Dexie, { liveQuery } from 'dexie'
import { createClient } from 'graphql-ws'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { runInDexieRootZone } from './runInDexieRootZone'

const NativePromise = Promise
const wait = (ms: number) =>
	new NativePromise((resolve) => setTimeout(resolve, ms))

// Minimal graphql-ws server double: opens, acks connection_init, closes like a browser socket.
class FakeWebSocket {
	static CONNECTING = 0
	static OPEN = 1
	static CLOSING = 2
	static CLOSED = 3
	static last: FakeWebSocket
	readyState = 0
	onopen?: () => void
	onmessage?: (event: { data: string }) => void
	onclose?: (event: object) => void
	onerror?: (event: unknown) => void
	protocol = 'graphql-transport-ws'

	constructor() {
		FakeWebSocket.last = this
		setTimeout(() => {
			this.readyState = 1
			this.onopen?.()
		}, 1)
	}

	send(raw: string) {
		if (JSON.parse(raw).type === 'connection_init') {
			setTimeout(
				() =>
					this.onmessage?.({
						data: JSON.stringify({ type: 'connection_ack' }),
					}),
				1
			)
		}
	}

	close(code = 1000, reason = '') {
		if (this.readyState >= 2) return
		this.readyState = 2
		setTimeout(() => {
			this.readyState = 3
			this.onclose?.({ type: 'close', code, reason, wasClean: true })
		}, 2)
	}
}

describe('runInDexieRootZone', () => {
	let db: Dexie
	let reported: unknown[]
	const onUnhandled = (event: Event) => {
		reported.push((event as PromiseRejectionEvent).reason)
	}

	beforeEach(async () => {
		reported = []
		window.addEventListener('unhandledrejection', onUnhandled)
		db = new Dexie(`zone-test-${Math.random()}`)
		db.version(1).stores({ items: 'id' })
		await db.open()
	})

	afterEach(() => {
		window.removeEventListener('unhandledrejection', onUnhandled)
		db.close()
	})

	// Calls `fn` from inside a liveQuery zone, like a render triggered by useLiveQuery.
	function callInsideLiveQuery<T>(fn: () => T): Promise<T> {
		return new NativePromise((resolve) => {
			let called = false
			const subscription = liveQuery(async () => {
				await db.table('items').get(1)
				if (!called) {
					called = true
					resolve(fn())
				}
				return 1
			}).subscribe({ next() {} })
			setTimeout(() => subscription.unsubscribe(), 5)
		})
	}

	async function subscribeThenUnsubscribe(
		wrap: <T>(fn: () => T) => T
	): Promise<unknown[]> {
		const client = createClient({
			url: 'ws://test',
			webSocketImpl: FakeWebSocket,
			lazy: true,
			keepAlive: 0,
		})
		const sink = { next() {}, error() {}, complete() {} }
		const unsubscribe = await callInsideLiveQuery(() =>
			wrap(() => client.subscribe({ query: 'subscription { x }' }, sink))
		)
		await wait(10)
		// last subscription gone -> lazy client closes the socket with code 1000
		unsubscribe()
		await wait(30)
		return reported
	}

	it('uses native Promise inside a liveQuery zone', async () => {
		const ctor = await callInsideLiveQuery(() =>
			runInDexieRootZone(() => new Promise(() => {}).constructor)
		)
		expect(ctor).toBe(NativePromise)
	})

	it('reproduces the CloseEvent report without the wrapper (WEB-APP-AX)', async () => {
		// Dexie also logs the "unhandled" rejection; keep test output clean
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const result = await subscribeThenUnsubscribe((fn) => fn())
		warn.mockRestore()
		expect(result).toEqual([
			expect.objectContaining({ type: 'close', code: 1000 }),
		])
	})

	it('does not report a normal socket close when subscribed via the wrapper', async () => {
		const result = await subscribeThenUnsubscribe(runInDexieRootZone)
		expect(result).toEqual([])
	})
})
