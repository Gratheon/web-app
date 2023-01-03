"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const index_less_1 = __importDefault(require("./index.less"));
function hiveNavigationPanel({ items }) {
    return (<div className={index_less_1.default.breadcrumbs}>
			{items.map((row, i) => {
            return (<span key={i}>
						<a href={row.uri}>{row.name}</a>
						{i + 1 < items.length && <span>&nbsp;&rarr;&nbsp;</span>}
					</span>);
        })}
		</div>);
}
exports.default = hiveNavigationPanel;
