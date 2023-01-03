"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setFrameSideFile = exports.setFileStroke = exports.getFrameSideFile = exports.setFiles = exports.getFiles = void 0;
const lodash_1 = require("lodash");
const db_1 = __importDefault(require("./db"));
let files = db_1.default.get('files');
function getFiles(where = {}) {
    return (0, lodash_1.orderBy)((0, lodash_1.filter)(files, where), ['position'], ['asc']);
}
exports.getFiles = getFiles;
function setFiles(data, where) {
    (0, lodash_1.remove)(files, where);
    if (data) {
        data.forEach((row) => {
            files.push({ ...row, ...where });
        });
    }
    db_1.default.set('files', files);
}
exports.setFiles = setFiles;
function getFrameSideFile({ hiveId, frameSideId, boxIndex = null, position = null, side = null, }) {
    let file;
    if (frameSideId) {
        file = (0, lodash_1.filter)(files, {
            hiveId,
            frameSideId,
        })[0];
    }
    else {
        file = (0, lodash_1.filter)(files, {
            hiveId,
            boxIndex,
            position,
            side,
        })[0];
    }
    if (!file) {
        return null;
    }
    return file;
}
exports.getFrameSideFile = getFrameSideFile;
function setFileStroke({ frameSideId, hiveId, strokeHistory, }) {
    // @ts-ignore
    const file = getFrameSideFile({
        frameSideId,
        hiveId
    });
    file.strokeHistory = strokeHistory;
}
exports.setFileStroke = setFileStroke;
function setFrameSideFile({ hiveId, boxIndex, position, side, uploadedFile, }) {
    //@ts-ignore
    hiveId = parseInt(hiveId, 10);
    setFiles([uploadedFile], { hiveId, boxIndex, position, side });
}
exports.setFrameSideFile = setFrameSideFile;
