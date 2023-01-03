"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const styles_less_1 = __importDefault(require("./styles.less"));
function VisualForm({ children, onSubmit, style = null }) {
    return (<form method="POST" style={style} className={styles_less_1.default.form} onSubmit={onSubmit}>
			{children}
		</form>);
}
exports.default = VisualForm;
