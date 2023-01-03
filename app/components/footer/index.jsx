"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const connectionStatus_1 = __importDefault(require("./connectionStatus"));
const isDev_1 = __importDefault(require("../isDev"));
const styles_less_1 = __importDefault(require("./styles.less"));
const api_1 = require("../api");
function Footer() {
    let apiUrl = 'https://graphql.gratheon.com/graphql';
    if ((0, isDev_1.default)()) {
        apiUrl = 'http://localhost:6100/graphql';
    }
    return (<ul id={styles_less_1.default.footer}>
			<li style={{ paddingTop: 4 }}><connectionStatus_1.default graphqlWsClient={api_1.graphqlWsClient}/></li>
			<li>
				<a href={apiUrl}>API</a>
			</li>
			<li>
				<a href="https://gratheon.com/terms">Terms of Use</a>
			</li>
			<li>
				<a href="https://gratheon.com/privacy">Privacy policy</a>
			</li>
		</ul>);
}
exports.default = Footer;
