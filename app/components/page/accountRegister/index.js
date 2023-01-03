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
const button_1 = __importDefault(require("../../shared/button"));
const user_1 = require("../../user");
const uri_1 = require("../../uri");
class AccountRegister extends preact_1.Component {
    onInput = (e) => {
        const { name, value } = e.target;
        this.setState({
            account: {
                ...this.state.account,
                [name]: value,
            },
        });
    };
    render() {
        let [accountAuth, { loading, error, data }] = (0, api_1.useMutation)((0, api_1.gql) `
			mutation register($email: String!, $password: String!) {
				register(email: $email, password: $password) {
					__typename
					... on Error {
						code
					}
					... on UserSession {
						key
					}
				}
			}
		`);
        function onSubmit(e) {
            e.preventDefault();
            accountAuth({
                email: this.state.account.email,
                password: this.state.account.password,
            });
        }
        if (!this.state.account) {
            this.setState({
                account: {
                    email: '',
                    password: '',
                },
            });
        }
        const account = this.state.account;
        if (!account || loading) {
            return <loader_1.default />;
        }
        if (data?.register?.key) {
            (0, user_1.saveToken)(data.register.key);
            window.location = (0, uri_1.getAppUri)() + '/apiaries/';
            return <loader_1.default />;
        }
        else if (data?.register?.code) {
            errorMsg = <messageError_1.default error="Invalid email or password"/>;
        }
        let errorMsg;
        if (error) {
            errorMsg = <messageError_1.default error={error}/>;
        }
        return (<div>
				{errorMsg}
				<visualForm_1.default onSubmit={onSubmit.bind(this)} style={{ padding: 15 }}>
					<div>
						<label htmlFor="email">Email</label>
						<input name="email" type="email" id="email" style={{ width: '100%' }} autoFocus value={account.email} onInput={this.onInput}/>
					</div>
					<div>
						<label htmlFor="password">Password</label>
						<input name="password" id="password" type="password" style={{ width: '100%' }} autoFocus value={account.password} onInput={this.onInput}/>
					</div>
					<div style={{ display: 'flex' }}>
						<div style={{ flexGrow: 1 }}></div>
						<button_1.default type="submit" className="green">
							Register
						</button_1.default>
					</div>
				</visualForm_1.default>
			</div>);
    }
}
exports.default = AccountRegister;
