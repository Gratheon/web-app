"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const preact_1 = require("preact");
const styles_less_1 = __importDefault(require("./styles.less"));
class VisualForm extends preact_1.Component {
    render({ children, onSubmit, style = '' }) {
        return (<form method="POST" style={style} className={styles_less_1.default.form} onSubmit={onSubmit}>
				{children}
			</form>);
    }
}
exports.default = VisualForm;
