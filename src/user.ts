import { dropDatabase } from './models/db';

import isDev from './isDev';
import { isTauriEnv } from './env'; // Import the flag

// Helper to detect if running inside Tauri
function isTauri(): boolean {
	// Use the flag set by the asynchronous check in env.ts
	return isTauriEnv;
}

export function isLoggedIn() {
	let loggedIn = false;
	if (isTauri()) {
		const token = localStorage.getItem('authToken');
		loggedIn = token !== null;
		console.debug(`[Auth Debug] isLoggedIn (Tauri): Checking localStorage 'authToken'. Found: ${!!token}. LoggedIn: ${loggedIn}`);
	} else {
		const token = getCookie('token');
		loggedIn = token !== undefined;
		console.debug(`[Auth Debug] isLoggedIn (Web): Checking cookie 'token'. Found: ${!!token}. LoggedIn: ${loggedIn}`);
	}
	return loggedIn;
}
export function getToken() {
	let token: string | undefined = undefined;
	if (isTauri()) {
		token = localStorage.getItem('authToken') ?? undefined; // Use nullish coalescing
		console.debug(`[Auth Debug] getToken (Tauri): Reading localStorage 'authToken'. Value: ${token ? '***' : 'null'}`);
		// No need to fallback here if specifically in Tauri, as saveToken uses localStorage
	} else if (typeof document !== 'undefined') {
		token = getCookie('token');
		console.debug(`[Auth Debug] getToken (Web): Reading cookie 'token'. Value: ${token ? '***' : 'undefined'}`);
	} else {
		console.debug(`[Auth Debug] getToken: Not in browser/Tauri env.`);
	}

	return token;
}

export function saveToken(token) {
	if (!token) {
		console.warn("[Auth Debug] saveToken called with null/undefined token. Aborting save.");
		return;
	}
	if (isTauri()) {
		localStorage.setItem('authToken', token);
		console.debug("[Auth Debug] saveToken (Tauri): Saved token to localStorage 'authToken'.");
	} else {
		setCookie('token', token, 30); // keep user logged in for a month
		console.debug("[Auth Debug] saveToken (Web): Saved token to cookie 'token'.");
	}
}

export function getShareToken(): string | null { // Allow null return
	const token = localStorage.getItem('shareToken');
	console.debug(`[Auth Debug] getShareToken: Reading localStorage 'shareToken'. Value: ${token ? '***' : 'null'}`);
	return token;
}

export function saveShareToken(token: string){
	if (!token) {
		console.warn("[Auth Debug] saveShareToken called with null/undefined token. Aborting save.");
		return;
	}
	localStorage.setItem('shareToken', token);
	console.debug("[Auth Debug] saveShareToken: Saved token to localStorage 'shareToken'.");
}

export async function logout() {
	console.debug("[Auth Debug] logout: Initiating logout process.");
	if (typeof document === 'undefined') {
		console.debug("[Auth Debug] logout: Not in browser env, exiting.");
		return
	}

	// Clear token based on environment
	if (isTauri()) {
		localStorage.removeItem('authToken'); // Remove from localStorage for Tauri
		console.debug("[Auth Debug] logout (Tauri): Removed 'authToken' from localStorage.");
	} else {
		setCookie('token', '', -1); // Expire cookie for Web
		console.debug("[Auth Debug] logout (Web): Expired 'token' cookie.");
	}


	// Clear share token and potentially other items (keep this if intended)
	localStorage.clear(); // Be cautious if other localStorage items are needed
	console.debug("[Auth Debug] logout: Called localStorage.clear().");


	try {
		await dropDatabase()
	} catch (e) {
		console.error(e)
	}

	// logout from support chat
	try{
		//@ts-ignore
		window?.Tawk_API?.logout(
			function(error){
				console.error(error)
			}
		);
	} catch (e) {
		console.error(e)
	}
}

function getCookie(name) {
	if (typeof document === 'undefined') {
		return
	}

	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) {
		const tokenValue = parts.pop()?.split(';').shift(); // Add optional chaining
		// console.debug(`[Auth Debug] getCookie: Found cookie '${name}'. Value: ${tokenValue ? '***' : 'undefined'}`);
		return tokenValue;
	}
	// console.debug(`[Auth Debug] getCookie: Cookie '${name}' not found.`);
	return undefined; // Explicitly return undefined if not found
}

function setCookie(cname, cvalue, exdays) {
	if (typeof document === 'undefined') {
		console.debug(`[Auth Debug] setCookie: Not in browser env, cannot set cookie '${cname}'.`);
		return
	}

	const d = new Date();
	d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
	const expires = 'expires=' + d.toUTCString();
	let cookieString = cname + '=' + cvalue + ';' + expires + ';path=/';

	// Only set domain attribute for production web builds (not dev, not Tauri)
	if (!isDev() && !isTauri()) {
		cookieString += ';domain=.gratheon.com';
	}

	document.cookie = cookieString;
}
