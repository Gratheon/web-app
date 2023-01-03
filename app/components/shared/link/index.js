"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const index_less_1 = __importDefault(require("./index.less"));
class Link {
    render({ href, children, className = index_less_1.default.small }) {
        return (<a href={href} className={className}>
				{children}
			</a>);
    }
}
exports.default = Link;
