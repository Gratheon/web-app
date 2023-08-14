import { db } from "./db";

export type User = {
	id?: number
	email?: string
	first_name?: string
	last_name?: string
	date_expiration?: string
	date_added?: string
	hasSubscription?: boolean
	isSubscriptionExpired?: boolean
}

export async function getUser(): Promise<User>{
	try {
		const user = await db['user'].first()
		if(user) return user
		else return null
	} catch (e) {
		console.error(e)
		throw e
	}
}


export async function updateUser(data: User){
	data.id = +data.id
    return await db['user'].put(data)
}