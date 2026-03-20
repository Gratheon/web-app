//@ts-nocheck
import Dexie from 'dexie'

import isDev from '@/isDev'

import { addCustomIndexes } from './addCustomIndexes.ts'
import { has } from 'lodash'

const DB_NAME = 'gratheon'
export const DB_VERSION = 105
const SCHEMA_SYNC_HMR_FLAG = `__gratheon_schema_synced_v${DB_VERSION}`
const DB_EVENT_HOOKS_FLAG = '__gratheon_db_event_hooks_installed'
const FRAME_SIDE_CELL_TABLE = 'files_frame_side_cells'
const FRAME_SIDE_FILE_TABLE = 'frame_side_file'

function shouldLogIndexedDbDebug() {
	return (
		typeof window !== 'undefined' &&
		(import.meta.env.DEV || window.localStorage.getItem('debug:offline-indexdb') === '1')
	)
}

export const db = new Dexie(DB_NAME, {
	autoOpen: true,
})
Dexie.debug = 'dexie'

if (
	shouldLogIndexedDbDebug() &&
	typeof db.on === 'function' &&
	typeof window !== 'undefined' &&
	!window[DB_EVENT_HOOKS_FLAG]
) {
	window[DB_EVENT_HOOKS_FLAG] = true

	db.on('ready', () => {
		console.debug('[IndexedDB] ready', {
			name: db.name,
			verno: db.verno,
			tables: db.tables?.map((table) => table.name) || [],
		})
	})
	db.on('populate', () => {
		console.debug('[IndexedDB] populate')
	})
	db.on('versionchange', (event) => {
		console.warn('[IndexedDB] versionchange', event)
	})
	db.on('close', () => {
		console.warn('[IndexedDB] close')
	})
}

export async function dropDatabase() {
	await db.delete()
	await db.close()
}

const graphqlToTableMap = {
	framesidecells: FRAME_SIDE_CELL_TABLE,
	framesidefile: FRAME_SIDE_FILE_TABLE,
}

export function syncGraphqlSchemaToIndexDB(schemaObject) {
	const dbIsOpen = typeof db.isOpen === 'function' ? db.isOpen() : false
	const dbVersion = typeof db.verno === 'number' ? db.verno : 0
	const hasInitializedTables = Array.isArray(db.tables) && db.tables.length > 0

	if (shouldLogIndexedDbDebug()) {
		console.debug('[IndexedDB] syncGraphqlSchemaToIndexDB:start', {
			dbName: DB_NAME,
			dbVersion: DB_VERSION,
			dbIsOpen,
			dbVersionCurrent: dbVersion,
			hasInitializedTables,
			currentTables: db.tables?.map((table) => table.name) || [],
		})
	}

	// During Vite HMR this module can be re-evaluated while Dexie instance remains open.
	// Re-registering the same schema in that state throws:
	// "SchemaError: Cannot add version when database is open".
	if (
		dbIsOpen &&
		hasInitializedTables &&
		typeof window !== 'undefined' &&
		window[SCHEMA_SYNC_HMR_FLAG]
	) {
		if (shouldLogIndexedDbDebug()) {
			console.debug('[IndexedDB] syncGraphqlSchemaToIndexDB:skip', { reason: 'hmr-flag-with-open-initialized-db' })
		}
		return
	}

	// If DB is already opened with same or newer version, schema registration is already done.
	if (dbIsOpen && hasInitializedTables && dbVersion >= DB_VERSION) {
		if (typeof window !== 'undefined') {
			window[SCHEMA_SYNC_HMR_FLAG] = true
		}
		if (shouldLogIndexedDbDebug()) {
			console.debug('[IndexedDB] syncGraphqlSchemaToIndexDB:skip', { reason: 'db-already-open-and-version-ready' })
		}
		return
	}

	// If DB is open but schema still needs registration, close before calling db.version(...).stores(...).
	if (dbIsOpen) {
		if (shouldLogIndexedDbDebug()) {
			console.debug('[IndexedDB] syncGraphqlSchemaToIndexDB:close-before-register')
		}
		db.close()
	}

	const typeMap = schemaObject.getTypeMap()
	const dbSchema = {}

	for (const type of Object.values(typeMap)) {
		if (type.astNode && type.astNode.kind === 'ObjectTypeDefinition') {
			const objName = type.astNode.name.value.toLowerCase()

			if (
				objName === 'mutation' ||
				objName === 'query' ||
				objName === 'error'
			) {
				continue
			}

			const fields = type.getFields()
			const fieldStrings = []
			for (const field of Object.values(fields)) {
				fieldStrings.push(field.name == 'id' ? '&id' : field.name)
			}

			let table_name = objName
			if (graphqlToTableMap[objName]) {
				table_name = graphqlToTableMap[objName]
			}

			dbSchema[table_name] = fieldStrings.join(', ')
		}
	}

	try {
		addCustomIndexes(dbSchema)
		if (shouldLogIndexedDbDebug()) {
			console.debug('[IndexedDB] Applying schema', {
				dbName: DB_NAME,
				dbVersion: DB_VERSION,
				tableCount: Object.keys(dbSchema).length,
				tables: Object.keys(dbSchema),
				hasUserTable: has(dbSchema, 'user'),
				userSchema: dbSchema.user,
			})
		}
		db.version(DB_VERSION).stores(dbSchema)
		if (shouldLogIndexedDbDebug()) {
			console.debug('[IndexedDB] stores() registered', {
				dbVersion: DB_VERSION,
				postRegisterTables: db.tables?.map((table) => table.name) || [],
			})
		}
		if (typeof window !== 'undefined') {
			window[SCHEMA_SYNC_HMR_FLAG] = true
		}
		if (typeof db.open === 'function') {
			db.open()
				.then(() => {
					if (shouldLogIndexedDbDebug()) {
						console.debug('[IndexedDB] open() succeeded', {
							verno: db.verno,
							tables: db.tables?.map((table) => table.name) || [],
						})
					}
				})
				.catch((error) => {
					console.error('[IndexedDB] open() failed after stores registration', error)
				})
		}
	} catch (e) {
		console.error('[syncGraphqlSchemaToIndexDB] Error applying schema:', e);
		throw e;
	}
}

// Generic function to updated IndexedDB table with graphql response
export async function upsertEntityWithNumericID(entityName, entity) {
	if (!entity) {
		console.trace(
			'No entity name provided for type ' +
				entityName +
				', this may be a bug and degrade performance'
		)
		return
	}

	if (!entity.id) {
		console.warn(
			'Cannot store entity without ID for type ' +
				entityName +
				'. Did you forget including id in query?',
			entity
		)
		return
	}

	entity.id = +entity.id

	return upsertEntity(entityName, entity)
}

export async function upsertEntity(entityName, entity) {
	try {
		entityName = entityName.toLowerCase()

		const ex = await db[entityName].get(entity.id)
		let updatedValue = { ...entity }

		if (ex) {
			updatedValue = {
				...ex,
				...updatedValue,
			}
		}

		await db[entityName].put(updatedValue)
	} catch (e) {
		console.error(e, entity)
		throw e
	}
}
