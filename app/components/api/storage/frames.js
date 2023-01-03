"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFrameWithSides = exports.removeFrame = exports.setFrameSideProperty = exports.moveFrame = exports.addFrame = exports.moveFramesToBox = exports.swapBox = exports.removeAllFromBox = exports.setFrames = exports.getFrames = exports.frameTypes = void 0;
const find_1 = __importDefault(require("lodash/find"));
const isNil_1 = __importDefault(require("lodash/isNil"));
const filter_1 = __importDefault(require("lodash/filter"));
const remove_1 = __importDefault(require("lodash/remove"));
const orderBy_1 = __importDefault(require("lodash/orderBy"));
const map_1 = __importDefault(require("lodash/map"));
const db_1 = __importDefault(require("./db"));
let frames = db_1.default.get('frames');
exports.frameTypes = {
    VOID: 'VOID',
    FOUNDATION: 'FOUNDATION',
    EMPTY_COMB: 'EMPTY_COMB',
    FEEDER: 'FEEDER',
    PARTITION: 'PARTITION',
};
function getFrames(where = {}) {
    return (0, orderBy_1.default)((0, filter_1.default)(frames, where), ['position'], ['asc']);
}
exports.getFrames = getFrames;
function setFrames(data, where) {
    (0, remove_1.default)(frames, where);
    if (data) {
        data.forEach((row) => {
            frames.push({ ...row, ...where });
        });
    }
    db_1.default.set('frames', frames);
}
exports.setFrames = setFrames;
function removeAllFromBox({ hiveId, boxIndex }) {
    hiveId = parseInt(hiveId, 10);
    (0, remove_1.default)(frames, { hiveId, boxIndex });
    db_1.default.set('frames', frames);
}
exports.removeAllFromBox = removeAllFromBox;
function swapBox({ hiveId, boxIndex, toBoxIndex }) {
    hiveId = parseInt(hiveId, 10);
    let tmpFrames = (0, filter_1.default)(frames, { hiveId });
    tmpFrames.map((v) => {
        if (v.boxIndex === boxIndex) {
            v.boxIndex = toBoxIndex;
        }
        else if (v.boxIndex === toBoxIndex) {
            v.boxIndex = boxIndex;
        }
    });
    setFrames(tmpFrames, { hiveId });
}
exports.swapBox = swapBox;
function moveFramesToBox({ hiveId, boxIndex, toBoxIndex }) {
    hiveId = parseInt(hiveId, 10);
    let tmpFrames = (0, filter_1.default)(frames, { hiveId });
    tmpFrames.map((v) => {
        if (v.boxIndex === boxIndex) {
            v.boxIndex = toBoxIndex;
        }
    });
    setFrames(tmpFrames, { hiveId });
}
exports.moveFramesToBox = moveFramesToBox;
function addFrame({ hiveId, boxIndex, frameType }) {
    hiveId = parseInt(hiveId, 10);
    let tmpFrames = (0, filter_1.default)(frames, { hiveId, boxIndex });
    const emptyFrame = {
        hiveId,
        boxIndex,
        type: frameType,
        leftSide: null,
        rightSide: null,
        position: (0, isNil_1.default)(tmpFrames) ? 0 : tmpFrames.length,
    };
    if (isFrameWithSides(frameType)) {
        const emptySide = () => ({
            broodPercent: 0,
            cappedBroodPercent: 0,
            droneBroodPercent: 0,
            honeyPercent: 0,
            pollenPercent: 0,
            queenDetected: false,
        });
        emptyFrame.leftSide = emptySide();
        emptyFrame.rightSide = emptySide();
    }
    tmpFrames.push(emptyFrame);
    setFrames(tmpFrames, { hiveId, boxIndex });
}
exports.addFrame = addFrame;
function moveFrame({ hiveId, removedIndex, addedIndex, boxIndex }) {
    hiveId = parseInt(hiveId, 10);
    removedIndex = parseInt(removedIndex, 10);
    addedIndex = parseInt(addedIndex, 10);
    boxIndex = parseInt(boxIndex, 10);
    let tmpFrames = (0, filter_1.default)(frames, { hiveId, boxIndex });
    tmpFrames.map((v) => {
        if (v.position === removedIndex) {
            v.position = -1;
        }
    });
    tmpFrames.map((v) => {
        if (v.position !== -1) {
            if (removedIndex > addedIndex) {
                if (v.position >= addedIndex) {
                    v.position++;
                }
                if (v.position > removedIndex + 1) {
                    v.position--;
                }
            }
            else {
                if (v.position >= removedIndex + 1) {
                    v.position--;
                }
                if (v.position >= addedIndex) {
                    v.position++;
                }
            }
        }
    });
    tmpFrames.map((v) => {
        if (v.position === -1) {
            v.position = addedIndex;
        }
    });
    setFrames(tmpFrames, { hiveId, boxIndex });
}
exports.moveFrame = moveFrame;
function setFrameSideProperty({ hiveId, boxIndex, position, side, prop, value, }) {
    hiveId = parseInt(hiveId, 10);
    const frame = (0, find_1.default)(frames, { hiveId, boxIndex, position });
    frame[side] = {
        ...frame[side],
    };
    frame[side][prop] = value;
}
exports.setFrameSideProperty = setFrameSideProperty;
function removeFrame({ hiveId, boxIndex, framePosition }) {
    hiveId = parseInt(hiveId, 10);
    let tmpFrames = (0, filter_1.default)(frames, { hiveId, boxIndex });
    (0, remove_1.default)(tmpFrames, {
        hiveId,
        position: framePosition,
    });
    (0, map_1.default)(tmpFrames, (v) => {
        if (v.position > framePosition) {
            v.position--;
        }
    });
    setFrames(tmpFrames, {
        hiveId,
        boxIndex,
    });
}
exports.removeFrame = removeFrame;
function isFrameWithSides(frameType) {
    return (frameType === exports.frameTypes.EMPTY_COMB ||
        frameType === exports.frameTypes.FOUNDATION ||
        frameType === exports.frameTypes.VOID);
}
exports.isFrameWithSides = isFrameWithSides;
