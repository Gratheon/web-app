"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const index_less_1 = __importDefault(require("./index.less"));
exports.default = ({ backgroundColor = 'black', value, width = 100, onChange, min = 0, max = 100, }) => {
    const perc = ~~(((1 * value - min) / (max - min)) * 100) + '%';
    const bgStyle = {
        backgroundColor,
        width: perc,
    };
    return (<div className={index_less_1.default.wrapper} style={{ width: `${width}px` }}>
			<input type="range" onInput={onChange} onChange={onChange} min={min} max={max} step="1" value={value || 0} data-before/>

			<div className={index_less_1.default.bg}>
				<div style={bgStyle} className={index_less_1.default.value}></div>
				<div style={{ backgroundColor: "black", flexGrow: 1 }}></div>
			</div>
		</div>);
};
