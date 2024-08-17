import { db } from "./db";

export type User = {
	id?: number
	email?: string
	first_name?: string
	last_name?: string
	lang?: string
	date_expiration?: string
	date_added?: string

	hasSubscription?: boolean
	isSubscriptionExpired?: boolean
	billingPlan?: string
}

const TABLE_NAME = 'user'

export async function getUser(): Promise<User> {
	try {
		const user = (await db[TABLE_NAME].toArray())[0]

		if (user) return user
		else return null
	} catch (e) {
		console.error(e)
		throw e
	}
}


export async function updateUser(data: User) {
	try {
		data.id = +data.id

		return await db[TABLE_NAME].put(data)
	} catch (e) {
		console.error(e)
		throw e
	}
}