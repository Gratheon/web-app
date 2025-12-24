export default function isDev() {
    if (import.meta.env.DEV) {
        return true;
    }

    if (import.meta.env.PROD) {
        return false;
    }

    const url = new URL(window.location.href);
    const hostWithoutPort = url.hostname;

    return hostWithoutPort === 'localhost' || hostWithoutPort === '0.0.0.0' || hostWithoutPort === '127.0.0.1';
}
