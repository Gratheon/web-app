import { db } from "./db";
import { persistLocale } from '@/shared/dateLocale';

export type User = {
	id?: number
	email?: string
	first_name?: string
	last_name?: string
	lang?: string
	locale?: string
	date_expiration?: string
	date_added?: string

	hasSubscription?: boolean
	isSubscriptionExpired?: boolean
	billingPlan?: string
}

const TABLE_NAME = 'user'
let hasLoggedMissingUserTable = false

export async function getUser(): Promise<User> {
	try {
		const table = db[TABLE_NAME]
		if (!table || typeof table.toArray !== 'function') {
			if (!hasLoggedMissingUserTable) {
				hasLoggedMissingUserTable = true
				console.warn('[models/user] User table not initialized yet', {
					tableName: TABLE_NAME,
					availableTables: db.tables?.map((entry) => entry.name) || [],
				})
			}
			return null
		}

		hasLoggedMissingUserTable = false

		const user = (await table.toArray())[0]

		if (user) return user
		else return null
	} catch (e) {
		console.error(e)
		console.error('[models/user] Failed to read user from IndexedDB', {
			tableName: TABLE_NAME,
			availableTables: db.tables?.map((table) => table.name) || [],
		})
		throw e
	}
}


export async function updateUser(data: User) {
	try {
		data.id = +data.id
		persistLocale(data.locale)

		return await db[TABLE_NAME].put(data)
	} catch (e) {
		console.error(e)
		throw e
	}
}
