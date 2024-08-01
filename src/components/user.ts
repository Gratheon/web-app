import isDev from "./isDev"
import { dropDatabase } from '@/components/models/db/index'
export function isLoggedIn() {
	return getCookie('token') !== undefined
}
export function getToken() {
	let token

	// in live take token from cookie
	if (typeof document !== 'undefined') {
		token = getCookie('token')
	}

	return token
}

export function saveToken(token) {
	setCookie('token', token, 30) // keep user logged in for a month
}

export function getShareToken(): string{
	return localStorage.getItem('shareToken')
}

export function saveShareToken(token: string){
	localStorage.setItem('shareToken', token)
}

export async function logout() {
	if (typeof document === 'undefined') {
		return
	}

	setCookie('token', '', -1)

	localStorage.clear()

	try {
		await dropDatabase()
	} catch (e) {
		console.error(e)
	}
}

function getCookie(name) {
	if (typeof document === 'undefined') {
		return
	}

	const value = `; ${document.cookie}`
	const parts = value.split(`; ${name}=`)
	if (parts.length === 2) return parts.pop().split(';').shift()
}

function setCookie(cname, cvalue, exdays) {
	if (typeof document === 'undefined') {
		return
	}

	const d = new Date()
	d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000)
	const expires = 'expires=' + d.toUTCString()
	document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/' + (isDev() ? '' : ';domain=.gratheon.com')
}
