"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const preact_1 = require("preact/dist/preact");
const index_less_1 = __importDefault(require("./index.less"));
const user_1 = require("../user");
class Header extends preact_1.Component {
    render() {
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
}
// Header.propTypes = {}
exports.default = Header;
