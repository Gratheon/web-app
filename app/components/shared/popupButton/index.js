"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopupButton = exports.PopupButtonGroup = void 0;
const react_1 = __importStar(require("react"));
const index_less_1 = __importDefault(require("./index.less"));
const button_1 = __importDefault(require("../button"));
const useOutsideClickHandler = (ref, callback) => {
    (0, react_1.useEffect)(() => {
        const handleClickOutside = (evt) => {
            if (ref.current && !ref.current.contains(evt.target)) {
                callback(); //Do what you want to handle in the callback
            }
        };
        if (typeof window === 'undefined') {
            return () => { };
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    });
};
function PopupButtonGroup({ children, style: inlineStyle = '', className = 'black', }) {
    return (<div className={`${index_less_1.default[className]} popupButtonGroup`} style={inlineStyle}>
			{children}
		</div>);
}
exports.PopupButtonGroup = PopupButtonGroup;
function PopupButton({ children, className = '' }) {
    const [extraButtonsVisible, setExtraButtonsVisible] = (0, react_1.useState)(false);
    const modalRef = (0, react_1.useRef)(null);
    useOutsideClickHandler(modalRef, () => setExtraButtonsVisible(false));
    return (<div ref={modalRef}>
			<button_1.default className={[`popupTrigger`, className]} onClick={(e) => {
            setExtraButtonsVisible(!extraButtonsVisible);
            e.preventDefault();
        }}>
				...
			</button_1.default>
			{extraButtonsVisible && <div className={index_less_1.default.popup}>{children}</div>}
		</div>);
}
exports.PopupButton = PopupButton;
