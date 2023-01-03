"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.saveToken = exports.getToken = exports.isLoggedIn = void 0;
function isLoggedIn() {
    return getCookie('token') !== undefined;
}
exports.isLoggedIn = isLoggedIn;
function getToken() {
    let token;
    // in live take token from cookie
    if (typeof document !== 'undefined') {
        token = getCookie('gratheon_session');
    }
    return token;
}
exports.getToken = getToken;
function saveToken(token) {
    setCookie('token', token, 1);
    setCookie('gratheon_session', token, 1);
}
exports.saveToken = saveToken;
function logout() {
    if (typeof document === 'undefined') {
        return;
    }
    document.cookie.split(';').forEach(function (c) {
        document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    localStorage.clear();
}
exports.logout = logout;
function getCookie(name) {
    if (typeof document === 'undefined') {
        return;
    }
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2)
        return parts.pop().split(';').shift();
}
function setCookie(cname, cvalue, exdays) {
    if (typeof document === 'undefined') {
        return;
    }
    const d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    const expires = 'expires=' + d.toUTCString();
    document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/';
}
