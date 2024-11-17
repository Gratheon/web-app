export default function isDev() {
    const url = new URL(window.location.href);
    const hostWithoutPort = url.hostname; // This will give you the host without the port
    return hostWithoutPort === 'localhost' || hostWithoutPort === '0.0.0.0';
}
