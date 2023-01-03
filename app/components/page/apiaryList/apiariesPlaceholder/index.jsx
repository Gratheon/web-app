"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const hiveIcon_1 = __importDefault(require("../../../shared/hiveIcon"));
function default_1() {
    return (<div style={{
            textAlign: 'center',
            width: '100%',
            padding: '20px 0',
            color: 'gray'
        }}>
			<p>No apiaries here yet</p>

			<hiveIcon_1.default size={20}/>
			<hiveIcon_1.default size={20}/>
			<hiveIcon_1.default size={20}/>
		</div>);
}
exports.default = default_1;
