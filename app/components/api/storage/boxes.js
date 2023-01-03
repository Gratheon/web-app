"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveBoxDown = exports.removeBox = exports.addBox = exports.setBoxes = exports.getBoxes = exports.boxTypes = void 0;
const find_1 = __importDefault(require("lodash/find"));
const filter_1 = __importDefault(require("lodash/filter"));
const remove_1 = __importDefault(require("lodash/remove"));
const orderBy_1 = __importDefault(require("lodash/orderBy"));
const map_1 = __importDefault(require("lodash/map"));
const db_1 = __importDefault(require("./db"));
let boxes = db_1.default.get('boxes');
exports.boxTypes = {
    DEEP: 'DEEP',
    SUPER: 'SUPER',
};
function getBoxes(where = () => true) {
    let t = (0, filter_1.default)(boxes, where);
    t = (0, orderBy_1.default)(t, ['position'], ['desc']);
    return t;
}
exports.getBoxes = getBoxes;
function setBoxes(data, where = null) {
    (0, remove_1.default)(boxes, where);
    data.forEach((row) => {
        boxes.push({ ...row, ...where });
    });
    db_1.default.set('boxes', boxes);
}
exports.setBoxes = setBoxes;
function addBox({ hiveId, boxType }) {
    const tmpBoxes = getBoxes({
        hiveId,
    });
    // @ts-ignore
    boxes.push({
        position: tmpBoxes.length,
        hiveId,
        type: boxType,
    });
    db_1.default.set('boxes', boxes);
}
exports.addBox = addBox;
function removeBox({ hiveId, position }) {
    const tmpBoxes = getBoxes({
        hiveId,
    });
    (0, remove_1.default)(tmpBoxes, {
        hiveId,
        position,
    });
    (0, map_1.default)(tmpBoxes, (v) => {
        if (v.position > position) {
            v.position--;
        }
    });
    setBoxes(tmpBoxes);
}
exports.removeBox = removeBox;
function moveBoxDown({ hiveId, index }) {
    if (index === 0) {
        return false;
    }
    const box = (0, find_1.default)(boxes, { hiveId, position: index });
    const bottom = (0, find_1.default)(boxes, { hiveId, position: index - 1 });
    if (!box || !bottom) {
        return false;
    }
    (0, remove_1.default)(boxes, { hiveId, position: index });
    (0, remove_1.default)(boxes, { hiveId, position: index - 1 });
    box.position--;
    bottom.position++;
    boxes.push(box);
    boxes.push(bottom);
    db_1.default.set('boxes', boxes);
    return true;
}
exports.moveBoxDown = moveBoxDown;
