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
const button_1 = __importDefault(require("../../shared/button"));
const user_1 = require("../../user");
const uri_1 = require("../../uri");
function AccountRegister() {
    let [account, setAccount] = (0, react_1.useState)({});
    function onInput(e) {
        const { name, value } = e.target;
        setAccount({
            ...account,
            [name]: value,
        });
    }
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
            email: account?.email,
            password: account?.password,
        });
    }
    if (!account) {
        setAccount({
            email: '',
            password: '',
        });
    }
    if (!account || loading) {
        return <loader_1.default />;
    }
    let errorMsg;
    if (data?.register?.key) {
        (0, user_1.saveToken)(data.register.key);
        //@ts-ignore
        window.location = (0, uri_1.getAppUri)() + '/apiaries/';
        return <loader_1.default />;
    }
    else if (data?.register?.code) {
        errorMsg = <messageError_1.default error="Invalid email or password"/>;
    }
    if (error) {
        errorMsg = <messageError_1.default error={error}/>;
    }
    return (<div>
			{errorMsg}
			<visualForm_1.default onSubmit={onSubmit} style={{ padding: 15 }}>
				<div>
					<label htmlFor="email">Email</label>
					<input name="email" type="email" id="email" style={{ width: '100%' }} autoFocus value={account.email} onInput={onInput}/>
				</div>
				<div>
					<label htmlFor="password">Password</label>
					<input name="password" id="password" type="password" style={{ width: '100%' }} autoFocus value={account.password} onInput={onInput}/>
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
exports.default = AccountRegister;
