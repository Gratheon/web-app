"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppUri = exports.uploadUri = exports.gatewayUri = void 0;
const isDev_1 = __importDefault(require("./isDev"));
function gatewayUri() {
    let uri = 'https://graphql.gratheon.com/graphql';
    if ((0, isDev_1.default)()) {
        // graphql-router
        uri = 'http://' + window.location.host.split(':')[0] + ':6100/graphql';
    }
    return uri;
}
exports.gatewayUri = gatewayUri;
function uploadUri() {
    let uri = 'https://image.gratheon.com/graphql';
    if ((0, isDev_1.default)()) {
        // image-splitter
        uri = 'http://' + window.location.host.split(':')[0] + ':8800/graphql';
    }
    return uri;
}
exports.uploadUri = uploadUri;
function getAppUri() {
    return 'http://' + window.location.host;
}
exports.getAppUri = getAppUri;
