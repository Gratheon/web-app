"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const index_less_1 = __importDefault(require("./index.less"));
const user_1 = require("../user");
function Header() {
    if ((0, user_1.isLoggedIn)()) {
        return (<nav id={index_less_1.default.header}>
				<a href="/apiaries">
					<img src="https://gratheon.com/img/logo_v4.svg"/>
				</a>
			</nav>);
    }
    else {
        return (<nav id={index_less_1.default.header}>
				<a href="/account/authenticate">
					<img src="https://gratheon.com/img/logo_v4.svg"/>
				</a>
			</nav>);
    }
}
exports.default = Header;
