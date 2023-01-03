"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const find_1 = __importDefault(require("lodash/find"));
const filter_1 = __importDefault(require("lodash/filter"));
const isNil_1 = __importDefault(require("lodash/isNil"));
const box_1 = __importDefault(require("./box"));
const frames_1 = require("../../../../storage/frames");
const selectedFrame_1 = __importDefault(require("./selectedFrame"));
const frameButtons_1 = __importDefault(require("./box/frameButtons"));
const button_1 = __importDefault(require("../../../shared/button"));
const index_less_1 = __importDefault(require("./index.less"));
const compat_1 = __importDefault(require("preact/compat"));
const boxes_1 = require("../../../../storage/boxes");
const addBox_1 = __importDefault(require("../../../../icons/addBox"));
const listInspections_1 = __importDefault(require("../../../shared/listInspections"));
exports.default = ({ hive, hiveId, frames, boxes, apiaryId, boxSelected, frameSelected = 0, frameSide, editable = true, onNotesChange, onBoxClick = () => { }, onBoxRemove = () => { }, onBoxAdd = () => { }, onMoveDown = () => { }, onFrameClose = () => { }, onFrameAdd = () => { }, onFrameSideFileUpload = () => { }, onDragDropFrame = () => { }, onFrameSideStatChange = () => { }, onFrameRemove = () => { }, }) => {
    const boxesDivs = [];
    let selectedFrameSide = null;
    for (let boxDivPosition = 0; boxDivPosition < boxes.length; boxDivPosition++) {
        const box = boxes[boxDivPosition];
        const currentBoxSelected = !editable || box.position === boxSelected;
        const showDownButton = boxes.length - 1 !== boxDivPosition;
        const boxFrames = (0, filter_1.default)(frames, { boxIndex: box.position });
        if (editable && !(0, isNil_1.default)(frameSelected) && !(0, isNil_1.default)(boxSelected)) {
            const selectedFrame = (0, find_1.default)(frames, {
                position: frameSelected,
                boxIndex: box.position,
            });
            const frameWithSides = !(0, isNil_1.default)(frameSide) &&
                selectedFrame &&
                (0, frames_1.isFrameWithSides)(selectedFrame.type);
            const frameSideObject = frameWithSides
                ? frameSide === 'left'
                    ? selectedFrame.leftSide
                    : selectedFrame.rightSide
                : null;
            if (currentBoxSelected && selectedFrame) {
                const onUpload = (uploadedFile) => {
                    onFrameSideFileUpload({
                        boxIndex: box.position,
                        position: selectedFrame.position,
                        side: frameSide,
                        uploadedFile,
                    });
                };
                selectedFrameSide = (<selectedFrame_1.default boxSelected={boxSelected} frameSelected={frameSelected} box={box} hiveId={hiveId} selectedFrame={selectedFrame} frameWithSides={frameWithSides} frameSide={frameSide} frameSideObject={frameSideObject} onUpload={onUpload} onFrameClose={onFrameClose} onFrameSideStatChange={onFrameSideStatChange}/>);
            }
        }
        boxesDivs.push(<div style="margin-bottom:15px;" onClick={(event) => {
                onBoxClick({ event, boxIndex: box.position });
            }}>
				{editable && currentBoxSelected && (<div style="height: 35px">
						<frameButtons_1.default frameSelected={frameSelected} onFrameRemove={onFrameRemove} onBoxAdd={onBoxAdd} onMoveDown={onMoveDown} onBoxRemove={onBoxRemove} onFrameAdd={onFrameAdd} showDownButton={showDownButton} box={box}/>
					</div>)}

				<div className={index_less_1.default.box}>
					<box_1.default boxType={box.type} boxPosition={box.position} boxSelected={boxSelected} editable={editable} frameSelected={frameSelected} frameSide={frameSide} frames={boxFrames} hiveId={hiveId} apiaryId={apiaryId} onDragDropFrame={(args) => {
                const { removedIndex, addedIndex, event } = args;
                onDragDropFrame({
                    event,
                    onDragDropFrame,
                    removedIndex,
                    addedIndex,
                    hiveId,
                    frameSide,
                    boxIndex: boxSelected,
                });
            }} onFrameAdd={() => onFrameAdd(box.position)}/>
				</div>
			</div>);
    }
    return (<div style="display:flex;padding:0 20px;">
			<div style="padding-right: 5px;overflow:hidden;flex-grow:3">
				<div style="display:flex;height:40px;">
					<h3 style="flex-grow:1">Hive sections</h3>

					<div style="display:flex;">
						<button_1.default title="Add box on top" className={['small', 'black']} onClick={() => onBoxAdd(boxes_1.boxTypes.DEEP)}>
							<addBox_1.default /> Add deep
						</button_1.default>
						<button_1.default title="Add box on top" onClick={() => onBoxAdd(boxes_1.boxTypes.SUPER)}>
							<addBox_1.default /> Add super
						</button_1.default>
					</div>
				</div>

				<div>{boxesDivs}</div>
			</div>

			{selectedFrameSide}

			{/* Notes */}
			{!selectedFrameSide && (<div style="flex-grow:6">
					<listInspections_1.default apiaryId={apiaryId} inspections={hive.inspections} hive={hive}/>
				</div>)}
		</div>);
};
