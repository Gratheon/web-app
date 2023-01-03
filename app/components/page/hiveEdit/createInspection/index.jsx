"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
const react_1 = __importDefault(require("react"));
const button_1 = __importDefault(require("../../../shared/button"));
const loader_1 = __importDefault(require("../../../shared/loader"));
const api_1 = require("../../../api");
const createInspectionMutation_graphql_1 = __importDefault(require("./createInspectionMutation.graphql"));
const boxes_1 = require("../../../api/storage/boxes");
const frames_1 = require("../../../api/storage/frames");
const messageError_1 = __importDefault(require("../../../shared/messageError"));
function inspectionForm({ onBeforeSave, hive }) {
    let [createInspection, { loadingCreateInspection, errorCreatingInspection }] = (0, api_1.useMutation)(createInspectionMutation_graphql_1.default);
    function addInspection(e) {
        e.preventDefault();
        if (!onBeforeSave(e)) {
            console.log('Parent saving failed, not creating new inspection');
            return;
        }
        let tmpBoxes = (0, boxes_1.getBoxes)({ hiveId: hive.id });
        let inspection = {
            boxes: (0, api_1.omitTypeName)(tmpBoxes),
            name: hive.name,
            family: (0, api_1.omitTypeName)(hive.family),
            frames: (0, frames_1.getFrames)({
                hiveId: hive.id,
            }),
        };
        inspection.stats = {
            honey: 0,
            brood: 0,
            pollen: 0,
            droneBrood: 0,
            cappedBrood: 0,
        };
        for (let box of inspection.boxes) {
            for (let frame of box.frames) {
                if (frame.leftSide.honeyPercent > 0) {
                    inspection.stats.honey += frame.leftSide.honeyPercent / 100;
                }
                if (frame.rightSide.honeyPercent > 0) {
                    inspection.stats.honey += frame.rightSide.honeyPercent / 100;
                }
            }
        }
        createInspection({
            inspection: {
                hiveId: hive.id,
                data: JSON.stringify(inspection),
            },
        });
    }
    if (loadingCreateInspection) {
        return <loader_1.default />;
    }
    if (errorCreatingInspection) {
        return <messageError_1.default error={errorCreatingInspection}/>;
    }
    return (<button_1.default title="Add inspection" onClick={(e) => {
            addInspection(e);
        }}>
			Save as inspection
		</button_1.default>);
}
exports.default = inspectionForm;
