import Dexie from 'dexie'

// Dexie 3 keeps "zones" (PSD) alive across awaits inside transactions and liveQuery,
// and while a zone is active it swaps `window.Promise` for its own DexiePromise.
// Any third-party code started in such a zone (e.g. graphql-ws creating its internal
// connection promises) inherits DexiePromise, and Dexie reports their rejections through
// its own `unhandledrejection` dispatch even when the library handles them.
//
// `Promise.PSD` / `Promise.usePSD` exist at runtime but are not in Dexie's typings.
type DexieZone = { parent?: DexieZone | null }
const DexiePromiseInternals = Dexie.Promise as unknown as {
	PSD: DexieZone
	usePSD: <T>(zone: DexieZone, fn: () => T) => T
}

function getRootZone(): DexieZone {
	// Walk up instead of caching at module load, so the result is correct even if this
	// module is first evaluated from inside a zone (e.g. a lazily imported chunk).
	let zone = DexiePromiseInternals.PSD
	while (zone.parent) {
		zone = zone.parent
	}
	return zone
}

// Runs `fn` in Dexie's global zone, so promises it creates are native ones.
export function runInDexieRootZone<T>(fn: () => T): T {
	return DexiePromiseInternals.usePSD(getRootZone(), fn)
}
