import alertsUrl from '@/assets/alerts.webp'
import bearUrl from '@/assets/bear.webp'
import beekeeperUrl from '@/assets/beekeeper.png'
import devicesUrl from '@/assets/devices.webp'
import flowerUrl from '@/assets/flower.png'
import hiveSystemsUrl from '@/assets/hive-systems.webp'
import logoUrl from '@/assets/logo_v7.svg'
import wideLogoUrl from '@/assets/logo_v7w.svg'
import queenUrl from '@/assets/queen.webp'
import symbiosisUrl from '@/assets/symbiosis.png'
import thinkerUrl from '@/assets/thinker.webp'

const UI_ASSET_URLS = [
	logoUrl,
	wideLogoUrl,
	thinkerUrl,
	queenUrl,
	devicesUrl,
	hiveSystemsUrl,
	alertsUrl,
	bearUrl,
	beekeeperUrl,
	flowerUrl,
	symbiosisUrl,
]

let didWarm = false
let isWarming = false
let listenerInstalled = false

function waitForServiceWorkerControl(timeoutMs = 5000): Promise<void> {
	if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
		return Promise.resolve()
	}

	if (navigator.serviceWorker.controller) {
		return Promise.resolve()
	}

	return new Promise((resolve) => {
		let settled = false
		const finish = () => {
			if (settled) return
			settled = true
			navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
			resolve()
		}

		const onControllerChange = () => finish()

		navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
		setTimeout(finish, timeoutMs)
	})
}

function preloadImage(url: string): Promise<void> {
	return new Promise((resolve) => {
		const img = new Image()
		img.decoding = 'async'
		img.onload = () => resolve()
		img.onerror = () => resolve()
		img.src = url
	})
}

async function warmUiAssetCache() {
	if (didWarm || isWarming || typeof window === 'undefined') {
		return
	}
	if (typeof navigator !== 'undefined' && !navigator.onLine) {
		return
	}

	isWarming = true
	try {
		// Ensure Workbox has control so image preloads are cached by SW runtime strategy.
		await waitForServiceWorkerControl()
		if (typeof navigator !== 'undefined' && !navigator.onLine) {
			return
		}

		await Promise.allSettled(UI_ASSET_URLS.map((url) => preloadImage(url)))
		didWarm = true
	} finally {
		isWarming = false
	}
}

export function precacheUiAssets(): void {
	if (typeof window === 'undefined') {
		return
	}

	void warmUiAssetCache()

	if (!listenerInstalled) {
		listenerInstalled = true
		window.addEventListener('online', () => {
			void warmUiAssetCache()
		})
		if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
			navigator.serviceWorker.addEventListener('controllerchange', () => {
				void warmUiAssetCache()
			})
		}
	}
}
