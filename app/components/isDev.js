"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isDev() {
    return (typeof window !== 'undefined' &&
        (window.location.host === 'localhost:8080' ||
            window.location.host === '0.0.0.0:8080' ||
            window.location.host === '192.168.46.100:8080'));
}
exports.default = isDev;
