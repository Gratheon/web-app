"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const react_1 = __importDefault(require("react"));
const styles_less_1 = __importDefault(require("./styles.less"));
const header_1 = __importDefault(require("../header"));
const user_1 = require("../user");
const react_router_dom_1 = require("react-router-dom");
const uri_1 = require("../uri");
const logOut = () => {
    (0, user_1.logout)();
    window.location.href = (0, uri_1.getAppUri)() + '/';
};
const Menu = ({ isLoggedIn = false }) => {
    if (!isLoggedIn) {
        return (<nav id={styles_less_1.default.menu}>
				<header_1.default />
				<ul>
					<li>
						<react_router_dom_1.Link activeClassName={styles_less_1.default.active} to="/account/authenticate">
							Authentication
						</react_router_dom_1.Link>
					</li>
					<li>
						<react_router_dom_1.Link activeClassName={styles_less_1.default.active} to="/account/register">
							Registration
						</react_router_dom_1.Link>
					</li>
					{/*<li>*/}
					{/*	<Link activeClassName={styles.active} href="/account/restore">*/}
					{/*		Restoration*/}
					{/*	</Link>*/}
					{/*</li>*/}
				</ul>
			</nav>);
    }
    return (<nav id={styles_less_1.default.menu}>
			<header_1.default />

			<ul>
				<li>
					<react_router_dom_1.Link activeClassName={styles_less_1.default.active} to="/apiaries">
						Hives
					</react_router_dom_1.Link>
				</li>
				<li>
					<react_router_dom_1.Link activeClassName={styles_less_1.default.active} to="/account">
						Account
					</react_router_dom_1.Link>
				</li>
				<li>
					<a href="#" onClick={logOut}>
						Log out
					</a>
				</li>
			</ul>
		</nav>);
};
exports.default = Menu;
