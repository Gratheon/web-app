// @ts-nocheck
import CryptoJS from 'crypto-js'

import { TAWKTO_TOKEN } from '@/config'
import isDev from '@/isDev'
import * as userModel from '@/models/user'
import { getAppUri } from '@/uri'
import { logout } from '@/user'

export async function onLogoutClick() {
	await logout()

	window.location.href = getAppUri() + '/account/authenticate/'
}

function generateHmac(message: string, secret: string) {
	return CryptoJS.HmacSHA256(message, secret).toString(CryptoJS.enc.Hex)
}

const TAWKTO_SCRIPT_URL =
	'https://embed.tawk.to/64b6ec5acc26a871b0293d74/1h5l8mh5h'
const TAWKTO_SCRIPT_ID = 'tawkto-support-chat-script'
const SUPPORT_FALLBACK_URL = 'https://gratheon.com'
let tawkScriptLoadingPromise: Promise<void> | null = null

function canLoadTawkSupportChat() {
	const hostname = window.location.hostname

	// WHY: production previews can run on localhost; WHAT: keep third-party support disabled for local/dev sessions.
	return !isDev() && hostname !== 'localhost' && hostname !== '127.0.0.1'
}

function getTawkApi() {
	window.Tawk_API = window.Tawk_API || {}
	return window.Tawk_API
}

function loadTawkScript() {
	const tawkApi = getTawkApi()

	if (
		typeof tawkApi.start === 'function' ||
		typeof tawkApi.maximize === 'function'
	) {
		return Promise.resolve()
	}

	if (tawkScriptLoadingPromise) {
		return tawkScriptLoadingPromise
	}

	// WHY: Tawk.to should not affect normal app navigation; WHAT: inject its remote script only after Support is clicked.
	window.Tawk_LoadStart = new Date()
	tawkApi.autoStart = false

	tawkScriptLoadingPromise = new Promise((resolve, reject) => {
		const existingScript = document.getElementById(TAWKTO_SCRIPT_ID)
		if (existingScript) {
			resolve()
			return
		}

		const script = document.createElement('script')
		const firstScript = document.getElementsByTagName('script')[0]

		script.id = TAWKTO_SCRIPT_ID
		script.async = true
		script.src = TAWKTO_SCRIPT_URL
		script.charset = 'UTF-8'
		script.setAttribute('crossorigin', '*')
		script.onload = () => resolve()
		script.onerror = () => {
			script.remove()
			tawkScriptLoadingPromise = null
			reject(new Error('Failed to load Tawk.to support chat'))
		}

		firstScript.parentNode.insertBefore(script, firstScript)
	})

	return tawkScriptLoadingPromise
}

function waitForTawkApi() {
	const tawkApi = window.Tawk_API

	if (
		typeof tawkApi?.start === 'function' ||
		typeof tawkApi?.maximize === 'function'
	) {
		return Promise.resolve(tawkApi)
	}

	// WHY: the script load event can fire before the widget API attaches methods; WHAT: wait briefly before falling back.
	return new Promise((resolve, reject) => {
		const startedAt = Date.now()
		const interval = window.setInterval(() => {
			const tawkApi = window.Tawk_API

			if (
				typeof tawkApi?.start === 'function' ||
				typeof tawkApi?.maximize === 'function'
			) {
				window.clearInterval(interval)
				resolve(tawkApi)
				return
			}

			if (Date.now() - startedAt > 5000) {
				window.clearInterval(interval)
				reject(new Error('Tawk.to API did not become ready'))
			}
		}, 50)
	})
}

function applyUserToTawk(tawkApi, userInfo, hash) {
	if (typeof tawkApi.login === 'function') {
		tawkApi.login(
			{
				hash,
				email: userInfo.email,
				name: `${userInfo.first_name} ${userInfo.last_name}`,
				userId: `${userInfo.id}`,
			},
			console.error
		)
	}

	if (typeof tawkApi.setAttributes === 'function') {
		tawkApi.setAttributes(
			{
				hash,
				email: userInfo.email,
				name: `${userInfo.first_name} ${userInfo.last_name}`,
			},
			console.error
		)
	}

	if (userInfo?.billingPlan && typeof tawkApi.addTags === 'function') {
		tawkApi.addTags([userInfo.billingPlan], console.error)
	}
}

export async function openSupportChat() {
	if (!canLoadTawkSupportChat()) {
		window.location.href = SUPPORT_FALLBACK_URL
		return
	}

	const existingTawkApi = window?.Tawk_API

	if (typeof existingTawkApi?.maximize === 'function') {
		existingTawkApi.maximize()
		return
	}

	const userInfo = await userModel.getUser()
	if (!userInfo?.email) {
		window.location.href = SUPPORT_FALLBACK_URL
		return
	}

	const hash = await generateHmac(`${userInfo.email}`, TAWKTO_TOKEN)
	const tawkApi = getTawkApi()

	tawkApi.autoStart = false
	tawkApi.language = 'en'
	tawkApi.onLoad = async function () {
		applyUserToTawk(tawkApi, userInfo, hash)

		if (typeof tawkApi.maximize === 'function') {
			tawkApi.maximize()
		}
	}

	try {
		await loadTawkScript()
		const readyTawkApi = await waitForTawkApi()

		if (typeof readyTawkApi.start === 'function') {
			readyTawkApi.start({
				message: 'Hi, how can we help you today?',
			})
		}

		if (typeof readyTawkApi.maximize === 'function') {
			readyTawkApi.maximize()
		}
	} catch (error) {
		console.error(error)
		window.location.href = SUPPORT_FALLBACK_URL
	}
}
