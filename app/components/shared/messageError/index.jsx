"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const index_less_1 = __importDefault(require("./index.less"));
exports.default = ({ error }) => {
    return (<div className={error?.graphQLErrors ? index_less_1.default.errorMsgBig : index_less_1.default.errorMsgSmall}>
			<span>🐻</span>
			<div>
				<h3>{typeof error === 'string' ? error : 'API error'}</h3>
				{error?.stack && <pre>{error.stack}</pre>}

				{error?.graphQLErrors &&
            error.graphQLErrors.map((e, i) => {
                return (<pre key={i}>
								<strong>{e.path?.join(' > ')}</strong> {e.message}
							</pre>);
            })}
			</div>
		</div>);
};
