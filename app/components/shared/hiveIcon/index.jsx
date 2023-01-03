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
const react_1 = __importStar(require("react"));
const index_less_1 = __importDefault(require("./index.less"));
//@ts-ignore
const Github_1 = __importDefault(require("react-color/es/Github"));
const colors = [
    '#4D4D4D',
    '#999999',
    '#FFFFFF',
    '#F44E3B',
    '#FE9200',
    '#FCDC00',
    '#DBDF00',
    '#A4DD00',
    '#68CCCA',
    '#73D8FF',
    '#AEA1FF',
    '#FDA1FF',
    '#333333',
    '#808080',
    '#cccccc',
    '#D33115',
    '#E27300',
    '#FCC400',
    '#B0BC00',
    '#68BC00',
    '#16A5A5',
    '#009CE0',
    '#7B64FF',
    '#FA28FF',
    '#000000',
    '#666666',
    '#B3B3B3',
    '#9F0500',
    '#C45100',
    '#FB9E00',
    '#808900',
    '#194D33',
    '#0C797D',
    '#0062B1',
    '#653294',
    '#AB149E',
];
function HiveIcon({ boxes = [], size = 60, editable = false, }) {
    const [colorPickerVisibleAt, showColorPicker] = (0, react_1.useState)(null);
    const [, updateState] = (0, react_1.useState)();
    //@ts-ignore
    const forceUpdate = react_1.default.useCallback(() => updateState({}), []);
    let hiveStyle = {
        width: `${size}px`,
    };
    const legsStyle = {
        height: `${size / 10}px`,
        borderLeft: `${size / 10}px solid black`,
        borderRight: `${size / 10}px solid black`,
    };
    const roofStyle = {
        height: `${size / 10}px`,
    };
    let visualBoxes = [];
    if (boxes && boxes.length > 0) {
        boxes.forEach((box, i) => {
            const boxStyle = {
                backgroundColor: box.color,
                paddingTop: `${size / 2}px`,
            };
            if (box.type === 'SUPER') {
                boxStyle.paddingTop = `${size / 4}px`;
            }
            else {
                boxStyle.paddingTop = `${size / 2}px`;
            }
            visualBoxes.push(<div onClick={() => {
                    //@ts-ignore
                    showColorPicker(colorPickerVisibleAt === null ? i : null);
                }} style={{
                    ...boxStyle,
                }} className={index_less_1.default.box}>
					{editable && colorPickerVisibleAt === i && (<Github_1.default width={300} colors={colors} onChangeComplete={(c) => {
                        box.color = c.hex; // !
                        showColorPicker(null);
                        forceUpdate();
                    }} color={box.color}/>)}
				</div>);
        });
    }
    return (<div className={index_less_1.default.hive} style={hiveStyle}>
			<div className={index_less_1.default.roof} style={roofStyle}></div>
			<div className={index_less_1.default.boxes}>{visualBoxes}</div>
			<div className={index_less_1.default.flightEntrance}></div>
			<div className={index_less_1.default.legs} style={legsStyle}></div>
		</div>);
}
exports.default = HiveIcon;
