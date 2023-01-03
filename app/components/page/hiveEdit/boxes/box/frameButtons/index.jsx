"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const frames_1 = require("../../../../../api/storage/frames");
const framesIcon_1 = __importDefault(require("../../../../../../icons/framesIcon"));
const popupButton_1 = require("../../../../../shared/popupButton");
const button_1 = __importDefault(require("../../../../../shared/button"));
const deleteIcon_1 = __importDefault(require("../../../../../../icons/deleteIcon"));
const downIcon_1 = __importDefault(require("../../../../../../icons/downIcon"));
function FrameButtons({ frameSelected, onFrameRemove, showDownButton, onMoveDown, onFrameAdd, onBoxRemove, box, }) {
    return (<div style={{ display: 'flex' }}>
			<popupButton_1.PopupButtonGroup style={`margin-right:3px`}>
				<button_1.default onClick={() => {
            onFrameAdd(box.position, frames_1.frameTypes.EMPTY_COMB);
        }}>
					<framesIcon_1.default /> Add comb
				</button_1.default>

				<popupButton_1.PopupButton>
					<button_1.default onClick={() => {
            onFrameAdd(box.position, frames_1.frameTypes.VOID);
        }}>
						empty frame
					</button_1.default>
					<button_1.default onClick={() => {
            onFrameAdd(box.position, frames_1.frameTypes.FOUNDATION);
        }}>
						foundation
					</button_1.default>
					<button_1.default onClick={() => {
            onFrameAdd(box.position, frames_1.frameTypes.FEEDER);
        }}>
						feeder
					</button_1.default>
					<button_1.default onClick={() => {
            onFrameAdd(box.position, frames_1.frameTypes.PARTITION);
        }}>
						partition
					</button_1.default>

					<button_1.default className="red" title="Delete frame" onClick={() => {
            onFrameRemove(box.position, frameSelected);
        }}>
						<deleteIcon_1.default />
						Delete frame
					</button_1.default>
				</popupButton_1.PopupButton>
			</popupButton_1.PopupButtonGroup>

			<button_1.default title="Move down" onClick={() => {
            if (showDownButton) {
                onMoveDown(box.position);
            }
        }}>
				<downIcon_1.default />
			</button_1.default>

			<button_1.default className="red" title="Delete box" onClick={() => {
            onBoxRemove(box.position);
        }}>
				<deleteIcon_1.default />
			</button_1.default>
		</div>);
}
exports.default = FrameButtons;
