"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const isNil_1 = __importDefault(require("lodash/isNil"));
const react_smooth_dnd_1 = require("@edorivai/react-smooth-dnd");
const index_less_1 = __importDefault(require("./index.less"));
const boxFrame_1 = __importDefault(require("./boxFrame"));
const crownIcon_1 = __importDefault(require("../../../../../icons/crownIcon"));
const frames_1 = require("../../../../api/storage/frames");
exports.default = ({ frames, editable = true, boxType, boxPosition, boxSelected, frameSelected, frameSide, onDragDropFrame, apiaryId, hiveId, }) => {
    const framesDiv = [];
    if (!(0, isNil_1.default)(frames)) {
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            if (editable) {
                framesDiv.push(<react_smooth_dnd_1.Draggable key={i}>
						<div style={{ textAlign: 'center', height: 20 }}>
							{(0, frames_1.isFrameWithSides)(frame.type) && (<crownIcon_1.default fill={frame.leftSide.queenDetected ? 'white' : '#444444'}/>)}
							{(0, frames_1.isFrameWithSides)(frame.type) && (<crownIcon_1.default fill={frame.rightSide.queenDetected ? 'white' : '#444444'}/>)}
						</div>

						<boxFrame_1.default boxSelected={boxSelected} frameSelected={frameSelected} frameSide={frameSide} boxPosition={boxPosition} hiveId={hiveId} apiaryId={apiaryId} frame={frame}/>
					</react_smooth_dnd_1.Draggable>);
            }
            else {
                framesDiv.push(<div key={i} className={index_less_1.default.frameOuter}>
						<div style={{ textAlign: 'center', height: 20 }}>
							{(0, frames_1.isFrameWithSides)(frame.type) && (<crownIcon_1.default fill={frame.leftSide.queenDetected ? 'white' : '#444444'}/>)}
							{(0, frames_1.isFrameWithSides)(frame.type) && (<crownIcon_1.default fill={frame.rightSide.queenDetected ? 'white' : '#444444'}/>)}
						</div>

						<boxFrame_1.default boxSelected={boxSelected} frameSelected={frameSelected} frameSide={frameSide} boxPosition={boxPosition} hiveId={hiveId} apiaryId={apiaryId} frame={frame}/>
					</div>);
            }
        }
    }
    return (<div className={`${index_less_1.default['boxType_' + boxType]} ${index_less_1.default.boxOuter} ${boxSelected === boxPosition && index_less_1.default.selected}`}>
			<div className={index_less_1.default.boxInner}>
				{/* @ts-ignore */}
				<react_smooth_dnd_1.Container style={{ height: `calc(100% - 30px)` }} onDrop={onDragDropFrame} orientation="horizontal">
					{framesDiv}
				</react_smooth_dnd_1.Container>
			</div>
		</div>);
};
