"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
function dateFormat({ datetime, options = {
    month: 'long',
    day: '2-digit',
    // year: 'numeric',
}, }) {
    return (<span className="date timeago" title={datetime}>
			{new Intl.DateTimeFormat('en-GB', options).format(new Date(datetime))}
		</span>);
}
exports.default = dateFormat;
