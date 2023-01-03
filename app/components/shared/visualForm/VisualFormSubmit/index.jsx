"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
exports.default = ({ children }) => {
    return (<div style={{ display: 'flex' }}>
			<div style={{ flexGrow: 1 }}></div>
			{children}
		</div>);
};
