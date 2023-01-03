"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const index_less_1 = __importDefault(require("./index.less"));
function Button({ style = {}, title = '', loading = false, className = 'black', type = 'button', onClick = () => { }, children = null, }) {
    let classNames = [];
    if (typeof className === 'string') {
        classNames = [index_less_1.default[className]];
    }
    else {
        // @ts-ignore
        for (const v of className) {
            classNames.push(index_less_1.default[`${index_less_1.default[v]}`]);
        }
    }
    return (<button style={style} disabled={loading} type={type} title={title} className={classNames.join(' ')} onClick={onClick}>
			{children}
		</button>);
}
exports.default = Button;
