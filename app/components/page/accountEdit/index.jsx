"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const api_1 = require("../../api");
const visualForm_1 = __importDefault(require("../../shared/visualForm"));
const loader_1 = __importDefault(require("../../shared/loader"));
const messageError_1 = __importDefault(require("../../shared/messageError"));
const VisualFormSubmit_1 = __importDefault(require("../../shared/visualForm/VisualFormSubmit"));
const button_1 = __importDefault(require("../../shared/button"));
const billing_1 = __importDefault(require("./billing"));
const invoices_1 = __importDefault(require("./invoices"));
function AccountEdit() {
    let [user, setUser] = (0, react_1.useState)({});
    function onInput(e) {
        const { name, value } = e.target;
        setUser({
            ...user,
            [name]: value,
        });
    }
    let { loading: loadingGet, data: accountData } = (0, api_1.useQuery)((0, api_1.gql) `
		query user {
			user {
				id
				email
				first_name
				last_name
				date_expiration
				date_added
				hasSubscription
				isSubscriptionExpired
			}
		}
	`);
    let [updateAccount, { loading, error }] = (0, api_1.useMutation)((0, api_1.gql) `
		mutation updateUser($user: UserUpdateInput!) {
			updateUser(user: $user) {
				... on User {
					email
				}

				... on Error {
					code
				}
			}
		}
	`);
    function onSubmit(e) {
        e.preventDefault();
        updateAccount({
            user: {
                first_name: user?.first_name,
                last_name: user?.last_name,
            },
        });
    }
    if (accountData && !user) {
        setUser(accountData.user);
    }
    if (!user || loading || loadingGet) {
        return <loader_1.default />;
    }
    let errorMsg;
    if (error) {
        errorMsg = <messageError_1.default error={error}/>;
    }
    return (<div style={{ padding: 20 }}>
			<h2>Account</h2>
			<visualForm_1.default onSubmit={onSubmit}>
				{errorMsg}
				<div>
					<label htmlFor="name">Email</label>
					{user.email}
				</div>
				<div>
					<label htmlFor="name">Name</label>
					<input name="first_name" id="first_name" placeholder="First name" style={{ width: '100%', marginRight: 10 }} autoFocus value={user.first_name} onInput={onInput}/>
					<input name="last_name" id="last_name" placeholder="Last name" style={{ width: '100%' }} autoFocus value={user.last_name} onInput={onInput}/>
				</div>
				<VisualFormSubmit_1.default>
					<button_1.default type="submit" className={`green`}>
						Save
					</button_1.default>
				</VisualFormSubmit_1.default>
			</visualForm_1.default>

			<billing_1.default user={user}/>
			<invoices_1.default />
		</div>);
}
exports.default = AccountEdit;
