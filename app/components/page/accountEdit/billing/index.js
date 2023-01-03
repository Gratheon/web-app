"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const date_fns_1 = require("date-fns");
const react_router_dom_1 = require("react-router-dom");
const loader_1 = __importDefault(require("../../../shared/loader"));
const button_1 = __importDefault(require("../../../shared/button"));
const api_1 = require("../../../api");
const messageSuccess_1 = __importDefault(require("../../../shared/messageSuccess"));
const messageError_1 = __importDefault(require("../../../shared/messageError"));
function Billing({ user }) {
    let { stripeStatus } = (0, react_router_dom_1.useParams)();
    let [createCheckoutSession, { loading, error }] = (0, api_1.useMutation)((0, api_1.gql) `
		mutation createCheckoutSession {
			createCheckoutSession
		}
	`);
    let [cancelSubscription, { loading: loadingCancel, error: errorCancel }] = (0, api_1.useMutation)((0, api_1.gql) `
			mutation cancelSubscription {
				cancelSubscription {
					... on User {
						hasSubscription
					}
					... on Error {
						code
					}
				}
			}
		`);
    async function onSubscribeClick() {
        const result = await createCheckoutSession();
        if (result?.data) {
            window.location = result.data.createCheckoutSession;
        }
    }
    async function onCancelSubscription() {
        const cancelResult = await cancelSubscription();
        console.log('cancelResult', cancelResult);
        if (!cancelResult.hasSubscription) {
            user.hasSubscription = cancelResult.hasSubscription;
        }
    }
    // createCheckoutSession
    if (loading) {
        return <loader_1.default />;
    }
    let expirationError = user.isSubscriptionExpired ? (<messageError_1.default error="Subscription expired, please extend"/>) : null;
    return (<div>
			<h2>Billing</h2>

			{expirationError}
			{error && <messageError_1.default error={error}/>}
			{errorCancel && <messageError_1.default error={errorCancel}/>}

			{stripeStatus === 'success' && (<messageSuccess_1.default title="Payment completed"/>)}
			{stripeStatus === 'cancel' && <messageError_1.default error="Payment cancelled"/>}
			<div style="font-size:12px;border-radius:5px; border:1px dotted gray; padding:20px;display:flex">
				<div style="flex-grow:1;">
					<div>
						Created: {(0, date_fns_1.format)(new Date(user.date_added), 'dd MMMM yyyy, hh:mm')}
					</div>
					<div>
						Expires at:{' '}
						{(0, date_fns_1.format)(new Date(user.date_expiration), 'dd MMMM yyyy, hh:mm')}
					</div>
				</div>

				<div>
					{!user.hasSubscription && (<button_1.default onClick={onSubscribeClick}>Subscribe</button_1.default>)}
					{user.hasSubscription && !loadingCancel && (<button_1.default onClick={onCancelSubscription}>Cancel subscription</button_1.default>)}
					{loadingCancel && <loader_1.default />}
				</div>
			</div>
		</div>);
}
exports.default = Billing;
