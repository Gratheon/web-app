// Flag to store whether the app is running in Tauri
export let isTauriEnv = false;

function hasTauriRuntime(): boolean {
	if (typeof window === 'undefined') {
		return false
	}

	const tauriWindow = window as unknown as {
		__TAURI__?: unknown
		__TAURI_INTERNALS__?: unknown
	}

	return Boolean(tauriWindow.__TAURI__ || tauriWindow.__TAURI_INTERNALS__)
}

// Asynchronous function to check for Tauri environment
export async function initializeEnvironment(): Promise<void> {
	if (!hasTauriRuntime()) {
		isTauriEnv = false;
		console.log('[Env Check] Detected Web environment.');
		return;
	}

	try {
		const { getTauriVersion } = await import('@tauri-apps/api/app');
		// Attempt to call a Tauri API function. If it succeeds, we're in Tauri.
		await getTauriVersion();
		isTauriEnv = true;
		console.log('[Env Check] Detected Tauri environment.');
	} catch (e) {
		// If the API call fails, we're likely in a standard web browser
		isTauriEnv = false;
		console.log('[Env Check] Detected Web environment.');
	}
}
