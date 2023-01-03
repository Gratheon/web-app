"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const styles_less_1 = __importDefault(require("./styles.less"));
const slider_1 = __importDefault(require("../../../../../shared/slider"));
exports.default = ({ title, color, percent, onChange, onClick, expanded = false, }) => (<div className={expanded ? styles_less_1.default.sliderExpanded : styles_less_1.default.slider}>
		<div className={styles_less_1.default.picker} style={{ backgroundColor: color }} onClick={onClick}>
			{Math.round(percent)} %{expanded && title}
		</div>
		{expanded && (<slider_1.default min={0} max={100} width={200} backgroundColor={color} onChange={onChange} value={percent}/>)}
	</div>);
