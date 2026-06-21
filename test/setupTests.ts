// jest-dom adds custom matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import { expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

function createMemoryStorage(): Storage {
	let store = new Map<string, string>()

	return {
		get length() {
			return store.size
		},
		clear() {
			store.clear()
		},
		getItem(key: string) {
			return store.has(key) ? store.get(key)! : null
		},
		key(index: number) {
			return Array.from(store.keys())[index] ?? null
		},
		removeItem(key: string) {
			store.delete(key)
		},
		setItem(key: string, value: string) {
			store.set(key, String(value))
		},
	}
}

function hasUsableStorage(storage: Storage | undefined): storage is Storage {
	return Boolean(
		storage &&
			typeof storage.clear === 'function' &&
			typeof storage.getItem === 'function' &&
			typeof storage.setItem === 'function' &&
			typeof storage.removeItem === 'function'
	)
}

if (typeof window !== 'undefined' && !hasUsableStorage(window.localStorage)) {
	const storage = createMemoryStorage()

	Object.defineProperty(window, 'localStorage', {
		configurable: true,
		value: storage,
	})
	Object.defineProperty(globalThis, 'localStorage', {
		configurable: true,
		value: storage,
	})
}

// You can add other global setup here if needed
