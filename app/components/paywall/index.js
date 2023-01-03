"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../api");
const react_router_dom_1 = require("react-router-dom");
function Paywall({ isLoggedIn = false }) {
    let { data: accountData } = (0, api_1.useQuery)((0, api_1.gql) `
		query user {
			user {
				id
				isSubscriptionExpired
			}
		}
	`);
    const location = (0, react_router_dom_1.useLocation)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const isInAccountView = location.pathname.match('/account(.*)') !== null;
    if (isLoggedIn &&
        !isInAccountView &&
        accountData?.user?.isSubscriptionExpired === true) {
        navigate(`/account`, { replace: true });
    }
    return null;
}
exports.default = Paywall;
