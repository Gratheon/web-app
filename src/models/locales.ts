import { db } from "./db";

export type Locale = {
	id?: number
	en: string
	ru?: string
	et?: string
	tr?: string
	pl?: string
	de?: string
	fr?: string
}

const TABLE_NAME = 'locale'

export async function getLocale(where = {}): Promise<Locale> {
	try {
		const user = (await db[TABLE_NAME].where(where).first())
		if (user) return user
		else return null
	} catch (e) {
		console.error(e)
		throw e
	}
}


export async function updateLocale(data: Locale) {
	try {
		data.id = +data.id
		return await db[TABLE_NAME].put(data)
	} catch (e) {
		console.error(e)
		throw e
	}
}