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
const react_router_1 = require("react-router");
const react_router_dom_1 = require("react-router-dom");
const lodash_1 = require("lodash");
const api_1 = require("../../api");
const loader_1 = __importDefault(require("../../shared/loader"));
const boxes_1 = __importDefault(require("./boxes"));
const hiveQuery_graphql_js_1 = __importDefault(require("./_api/hiveQuery.graphql.js"));
const editFormTop_1 = __importDefault(require("./editFormTop"));
const breadcrumbs_1 = __importDefault(require("./breadcrumbs"));
const hiveEditMutation_graphql_js_1 = __importDefault(require("./_api/hiveEditMutation.graphql.js"));
const filesStrokeEditMutation_graphql_js_1 = __importDefault(require("./_api/filesStrokeEditMutation.graphql.js"));
const messageError_1 = __importDefault(require("../../shared/messageError"));
const messageErrorGlobal_1 = __importDefault(require("../../shared/messageErrorGlobal"));
const messageSuccess_1 = __importDefault(require("../../shared/messageSuccess"));
const boxes_2 = require("../../api/storage/boxes");
const files_1 = require("../../api/storage/files");
const frames_1 = require("../../api/storage/frames");
const files_2 = require("../../api/storage/files");
const files_3 = require("../../api/storage/files");
function HiveEditForm() {
    let { apiaryId, hiveId, boxSelected, frameSelected, frameSide } = (0, react_router_dom_1.useParams)();
    let navigate = (0, react_router_1.useNavigate)();
    let { loading: loadingGet, error: errorGet, data: hiveGet, } = (0, api_1.useQuery)(hiveQuery_graphql_js_1.default, { variables: { id: hiveId } });
    let [updateHive, { loading: loadingUpdate, error, data }] = (0, api_1.useMutation)(hiveEditMutation_graphql_js_1.default);
    let [updateFileStroke] = (0, api_1.useMutation)(filesStrokeEditMutation_graphql_js_1.default);
    const [loaded, setLoaded] = (0, react_1.useState)(false);
    const [hive, setHive] = (0, react_1.useState)(null);
    const [boxes, setBoxesCb] = (0, react_1.useState)((0, boxes_2.getBoxes)({ hiveId }));
    const [frames, setFramesCb] = (0, react_1.useState)((0, frames_1.getFrames)({ hiveId }));
    if (!boxSelected) {
        boxSelected = '0';
    }
    function sync() {
        setFramesCb((0, frames_1.getFrames)({ hiveId }));
        setBoxesCb((0, boxes_2.getBoxes)({ hiveId }));
    }
    // initial state setting
    if (!loaded && hiveGet) {
        setHive(hiveGet.hive);
        (0, files_1.setFiles)(hiveGet.hive.files, { hiveId });
        (0, boxes_2.setBoxes)(hiveGet.hive.boxes, { hiveId });
        setBoxesCb((0, boxes_2.getBoxes)({ hiveId }));
        for (let boxIndex = 0; boxIndex < hiveGet.hive.boxes.length; boxIndex++) {
            const box = hiveGet.hive.boxes[boxIndex];
            (0, frames_1.setFrames)(box.frames, { hiveId, boxIndex: box.position });
        }
        setFramesCb((0, frames_1.getFrames)({ hiveId }));
        setLoaded(true);
    }
    let errorMsg;
    if (errorGet) {
        return <messageError_1.default error={errorGet}/>;
    }
    else if (error) {
        errorMsg = <messageError_1.default error={error}/>;
    }
    if (!hive || loadingGet || loadingUpdate) {
        return <loader_1.default />;
    }
    function onSubmit(e) {
        e.preventDefault();
        let tmpBoxes = (0, boxes_2.getBoxes)({ hiveId });
        tmpBoxes.forEach((v) => {
            v.frames = (0, frames_1.getFrames)({
                hiveId,
                boxIndex: v.position,
            });
        });
        updateHive({
            hive: {
                id: hiveId,
                boxes: (0, api_1.omitTypeName)(tmpBoxes),
                name: hive.name,
                notes: hive.notes,
                family: (0, api_1.omitTypeName)(hive.family),
            },
        });
        tmpBoxes.forEach((v) => {
            delete v.frames;
        });
        updateFileStroke({
            files: (0, files_2.getFiles)({ hiveId }).map((v) => {
                return {
                    hiveId: v.hiveId,
                    frameSideId: v.frameSideId,
                    fileId: v.file?.id,
                    strokeHistory: v.strokeHistory ? v.strokeHistory : [],
                };
            }),
        });
        return true;
    }
    let okMsg;
    if (data) {
        okMsg = <messageSuccess_1.default />;
    }
    function setName(name) {
        setHive({
            ...hive,
            name,
        });
    }
    function onNotesChange(notes) {
        setHive({
            ...hive,
            notes,
        });
    }
    function setRace(race) {
        let family = {
            race,
        };
        if (hive.family) {
            family = {
                ...hive.family,
                ...family,
            };
        }
        setHive({
            ...hive,
            family,
        });
    }
    function setQueenYear(added) {
        let family = {
            added,
        };
        if (hive.family) {
            family = {
                ...hive.family,
                added,
            };
        }
        setHive({
            ...hive,
            family,
        });
    }
    // boxes
    function onBoxRemove(position) {
        (0, frames_1.removeAllFromBox)({ hiveId: hive.id, boxIndex: position });
        const boxes = (0, boxes_2.getBoxes)({ hiveId: hive.id });
        (0, boxes_2.removeBox)({ hiveId: hive.id, position });
        (0, lodash_1.map)(boxes, (v) => {
            if (v.position >= position) {
                (0, frames_1.moveFramesToBox)({
                    hiveId: hive.id,
                    boxIndex: v.position + 1,
                    toBoxIndex: v.position,
                });
            }
        });
        sync();
    }
    function onMoveDown(index) {
        if ((0, boxes_2.moveBoxDown)({ hiveId: hive.id, index })) {
            (0, frames_1.swapBox)({
                hiveId: hive.id,
                boxIndex: index,
                toBoxIndex: index - 1,
            });
            sync();
        }
    }
    function onBoxAdd(boxType) {
        (0, boxes_2.addBox)({ hiveId: hive.id, boxType });
        sync();
    }
    // frames
    function onFrameAdd(boxIndex, frameType) {
        (0, frames_1.addFrame)({
            hiveId: hive.id,
            boxIndex,
            frameType,
        });
        sync();
    }
    function onFrameRemove(boxIndex, framePosition) {
        (0, frames_1.removeFrame)({
            hiveId: hive.id,
            boxIndex,
            framePosition,
        });
        sync();
    }
    function onDragDropFrame({ removedIndex, addedIndex, boxIndex, apiaryId, hiveId, frameSide, }) {
        (0, frames_1.moveFrame)({
            hiveId,
            removedIndex,
            addedIndex,
            boxIndex,
        });
        sync();
        //redirect
        if (!(0, lodash_1.isNil)(frameSide)) {
            // event.stopPropagation()
            navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxIndex}/frame/${addedIndex}/${frameSide}`, { replace: true });
        }
    }
    function onFrameClose(event) {
        event.stopPropagation();
        navigate(`/apiaries/${apiaryId}/hives/${hiveId}`, { replace: true });
    }
    function onFrameSideStatChange(boxIndex, position, side, prop, value) {
        (0, frames_1.setFrameSideProperty)({
            hiveId,
            boxIndex,
            position,
            side: side === 'left' ? 'leftSide' : 'rightSide',
            prop,
            value,
        });
        sync();
    }
    function onFrameSideFileUpload({ boxIndex, position, side, uploadedFile }) {
        (0, files_3.setFrameSideFile)({
            hiveId,
            boxIndex,
            position,
            side,
            uploadedFile,
        });
    }
    function onBoxClick({ event, boxIndex }) {
        // match only background div to consider it as a selection to avoid overriding redirect to frame click
        if (typeof event.target.className === 'string' &&
            event.target.className.indexOf('boxInner') === 0) {
            event.stopPropagation();
            navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxIndex}`, {
                replace: true,
            });
        }
    }
    return (<div>
			<breadcrumbs_1.default items={[
            {
                name: 'apiary',
                uri: `/apiaries/edit/${apiaryId}`,
            },
            {
                name: hive.name,
                uri: `/apiaries/${apiaryId}/hives/${hive.id}`,
            },
        ]}/>
			<messageErrorGlobal_1.default />

			{errorMsg}
			{okMsg}

			<editFormTop_1.default hive={hive} boxes={boxes} onSubmit={onSubmit} onInput={(e) => setName(e.target.value)} apiaryId={apiaryId} onNotesChange={(e) => onNotesChange(e.target.value)} onRaceChange={(e) => setRace(e.target.value)} onQueenYearChange={(e) => setQueenYear(e.target.value)}/>

			<boxes_1.default apiaryId={apiaryId} hiveId={hive.id} boxes={boxes} frames={frames} boxSelected={boxSelected} frameSelected={frameSelected} frameSide={frameSide} onDragDropFrame={onDragDropFrame} onMoveDown={onMoveDown} onBoxRemove={onBoxRemove} onBoxAdd={onBoxAdd} onBoxClick={onBoxClick} onFrameAdd={onFrameAdd} onFrameClose={onFrameClose} onFrameRemove={onFrameRemove} onFrameSideStatChange={onFrameSideStatChange} onFrameSideFileUpload={onFrameSideFileUpload}/>
		</div>);
}
exports.default = HiveEditForm;
