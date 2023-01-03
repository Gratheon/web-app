"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const index_less_1 = __importDefault(require("./index.less"));
exports.default = ({ title = 'Saved!', message = '' }) => {
    return (<div className={index_less_1.default.successMsg}>
			<span>🍯</span>
			<div>
				<h3>{title}</h3>
				{message && <p>{message}</p>}
			</div>
		</div>);
};
