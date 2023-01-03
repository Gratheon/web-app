"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const index_less_1 = __importDefault(require("./index.less"));
const api_1 = require("../../api");
exports.default = () => {
    if (api_1.lastNetworkError) {
        if (api_1.lastNetworkError.statusCode == 403) {
            return (<div className={index_less_1.default.errorGeneral}>
					<span>🔒</span>
					<div>
						<h3>General error</h3>
						<pre>Unauthorized or expired session</pre>
						<pre>
							Please <a href="https://gratheon.com">login first</a>
						</pre>
					</div>
				</div>);
        }
        else {
            return (<div className={index_less_1.default.errorGeneral}>
					<span>🔌</span>
					<div>
						<h3>Network error</h3>
						<pre>{api_1.lastNetworkError.message}</pre>
					</div>
				</div>);
        }
    }
};
