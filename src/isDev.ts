export default function isDev() {
    // Use Vite's environment variable to reliably detect production builds.
    // import.meta.env.PROD is true during `vite build`.
    // Fallback to hostname check for non-Vite environments (less likely needed).
    if (import.meta.env.PROD !== undefined) {
        return !import.meta.env.PROD; // isDev is true if NOT production
    }

    // Fallback logic (less reliable, especially in Tauri)
    const url = new URL(window.location.href);
    const hostWithoutPort = url.hostname;
    return hostWithoutPort === 'localhost' || hostWithoutPort === '0.0.0.0';
}
