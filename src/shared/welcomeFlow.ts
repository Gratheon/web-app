const REGISTRATION_WELCOME_PENDING_KEY = 'gratheon.registrationWelcomePending'
const HIVE_CREATED_CELEBRATION_PENDING_PREFIX =
	'gratheon.hiveCreatedCelebrationPending'

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

function hiveCreatedCelebrationKey(
	apiaryId: string | number,
	hiveId: string | number
) {
	return `${HIVE_CREATED_CELEBRATION_PENDING_PREFIX}.${apiaryId}.${hiveId}`
}

export function markHiveCreatedCelebrationPending(
	apiaryId: string | number,
	hiveId: string | number
) {
	const storage = getSessionStorage()
	if (!storage) {
		return
	}

	storage.setItem(hiveCreatedCelebrationKey(apiaryId, hiveId), '1')
}

export function consumeHiveCreatedCelebrationPending(
	apiaryId: string | number | undefined,
	hiveId: string | number | undefined
) {
	const storage = getSessionStorage()
	if (!storage || apiaryId == null || hiveId == null) {
		return false
	}

	const key = hiveCreatedCelebrationKey(apiaryId, hiveId)
	const isPending = storage.getItem(key) === '1'
	if (isPending) {
		storage.removeItem(key)
	}

	return isPending
}
