"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const preact_1 = require("preact");
const api_1 = require("../../api");
const visualForm_1 = __importDefault(require("../../shared/visualForm"));
const loader_1 = __importDefault(require("../../shared/loader"));
const messageError_1 = __importDefault(require("../../shared/messageError"));
const VisualFormSubmit_1 = __importDefault(require("../../shared/visualForm/VisualFormSubmit"));
const button_1 = __importDefault(require("../../shared/button"));
const billing_1 = __importDefault(require("./billing"));
const invoices_1 = __importDefault(require("./invoices"));
class AccountEdit extends preact_1.Component {
    onInput = (e) => {
        const { name, value } = e.target;
        this.setState({
            user: {
                ...this.state.user,
                [name]: value,
            },
        });
    };
    render() {
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
                    first_name: this.state.user.first_name,
                    last_name: this.state.user.last_name,
                },
            });
        }
        if (accountData && !this.state.user) {
            this.setState({
                user: accountData.user,
            });
        }
        const user = this.state.user;
        if (!user || loading || loadingGet) {
            return <loader_1.default />;
        }
        let errorMsg;
        if (error) {
            errorMsg = <messageError_1.default error={error}/>;
        }
        return (<div style="padding:20px;">
				<h2>Account</h2>
				<visualForm_1.default onSubmit={onSubmit.bind(this)}>
					{errorMsg}
					<div>
						<label htmlFor="name">Email</label>
						{user.email}
					</div>
					<div>
						<label htmlFor="name">Name</label>
						<input name="first_name" id="first_name" placeholder="First name" style={{ width: '100%', marginRight: 10 }} autoFocus value={user.first_name} onInput={this.onInput}/>
						<input name="last_name" id="last_name" placeholder="Last name" style={{ width: '100%' }} autoFocus value={user.last_name} onInput={this.onInput}/>
					</div>
					<VisualFormSubmit_1.default>
						<button_1.default type="submit" class="green">
							Save
						</button_1.default>
					</VisualFormSubmit_1.default>
				</visualForm_1.default>

				<billing_1.default user={user}/>
				<invoices_1.default />
			</div>);
    }
}
exports.default = AccountEdit;
