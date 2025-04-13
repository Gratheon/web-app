import { getTauriVersion } from '@tauri-apps/api/app';

// Flag to store whether the app is running in Tauri
export let isTauriEnv = false;

// Asynchronous function to check for Tauri environment
export async function initializeEnvironment(): Promise<void> {
  try {
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
