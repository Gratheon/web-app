"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const loader_1 = __importDefault(require("../../../../../shared/loader"));
function ImgLoading({ src, style }) {
    if (!src) {
        return <></>;
    }
    if (typeof document === 'undefined') {
        return;
    }
    const [show, setShow] = react_1.default.useState(false);
    react_1.default.useEffect(() => {
        const image = document.createElement('img');
        image.src = src;
        image.onload = () => {
            setShow(true);
        };
    }, []);
    if (!show) {
        return <loader_1.default />;
    }
    return (<>
			<img src={src} alt="" style={show ? style : { display: 'none' }}/>
		</>);
}
exports.default = ImgLoading;
