"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const index_less_1 = __importDefault(require("./index.less"));
function Index({ year }) {
    if (!year) {
        return null;
    }
    let colorRemainder = (year - 2011) % 5;
    let color = '#fefee3';
    switch (colorRemainder) {
        case 0:
            color = '#fefee3';
            break;
        case 1:
            color = '#ffba08';
            break;
        case 2:
            color = '#f94144';
            break;
        case 3:
            color = '#38b000';
            break;
        case 4:
            color = '#0466c8';
            break;
    }
    // margin-left: -11px;
    // border-radius: 5px;
    // z-index: -1;
    return <div style={{ background: color }} className={index_less_1.default.queenColor}></div>;
}
exports.default = Index;
