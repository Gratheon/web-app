const REGISTRATION_WELCOME_PENDING_KEY = 'gratheon.registrationWelcomePending'

function getSessionStorage() {
	if (typeof window === 'undefined') {
		return null
	}

	try {
		return window.sessionStorage
	} catch (error) {
		console.error('Session storage is not available', error)
		return null
	}
}

export function markRegistrationWelcomePending() {
	const storage = getSessionStorage()
	if (!storage) {
		return
	}

	storage.setItem(REGISTRATION_WELCOME_PENDING_KEY, '1')
}

export function consumeRegistrationWelcomePending() {
	const storage = getSessionStorage()
	if (!storage) {
		return false
	}

	const isPending = storage.getItem(REGISTRATION_WELCOME_PENDING_KEY) === '1'
	if (isPending) {
		storage.removeItem(REGISTRATION_WELCOME_PENDING_KEY)
	}

	return isPending
}
