"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const index_less_1 = __importDefault(require("./index.less"));
const frame_1 = __importDefault(require("../frame"));
exports.default = ({ boxSelected, frameSelected, box, hiveId, selectedFrame, frameWithSides, frameSide, frameSideObject, onUpload, onFrameClose, onFrameSideStatChange, }) => {
    return (<div className={index_less_1.default.selectedFrame}>
			{frameWithSides && (<frame_1.default hiveId={hiveId} frameSideId={frameSideObject.id} onUpload={onUpload} onFrameSideStatChange={(key, value) => onFrameSideStatChange(boxSelected, frameSelected, frameSide, key, value)} frameSide={frameSideObject} onQueenToggle={() => {
                onFrameSideStatChange(box.position, selectedFrame.position, frameSide, 'queenDetected', !frameSideObject.queenDetected);
            }} onFrameClose={onFrameClose} selectedFrame={selectedFrame} box={box}/>)}
		</div>);
};
