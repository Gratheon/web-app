"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const preact_1 = require("preact");
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
