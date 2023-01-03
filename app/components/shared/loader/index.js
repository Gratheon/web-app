"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const preact_1 = require("preact/dist/preact");
const styles_less_1 = __importDefault(require("./styles.less"));
class Loading extends preact_1.Component {
    render() {
        return (<div className={styles_less_1.default.loader}>
				<div className={styles_less_1.default.sun}>🌻</div>
				<div className={styles_less_1.default.bees}>
					<div className={styles_less_1.default.b1}></div>
					<div className={styles_less_1.default.b2}></div>
					<div className={styles_less_1.default.b3}></div>
					<div className={styles_less_1.default.b4}></div>
					<div className={styles_less_1.default.b5}></div>
					<div className={styles_less_1.default.b6}></div>
				</div>
			</div>);
    }
}
exports.default = Loading;
