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
const styles_less_1 = __importDefault(require("./styles.less"));
const colors_1 = __importDefault(require("../../../../colors"));
const uploadFile_1 = __importDefault(require("./uploadFile"));
const resourceEditRow_1 = __importDefault(require("./resourceEditRow"));
const api_1 = require("../../../../api");
const drawingCanvas_1 = __importDefault(require("./drawingCanvas"));
const files_1 = require("../../../../api/storage/files");
const button_1 = __importDefault(require("../../../../shared/button"));
const crownIcon_1 = __importDefault(require("../../../../../icons/crownIcon"));
const addFileToFrameSideMutation_graphql_1 = __importDefault(require("./_api/addFileToFrameSideMutation.graphql"));
const getFrameFileObjectsQuery_graphql_1 = __importDefault(require("./_api/getFrameFileObjectsQuery.graphql"));
const loader_1 = __importDefault(require("../../../../shared/loader"));
const files_2 = require("../../../../api/storage/files");
exports.default = ({ frameSide, frameSideId, onUpload, onFrameSideStatChange, hiveId, onFrameClose, onQueenToggle, }) => {
    let [expanded, expand] = (0, react_1.useState)(false);
    let { loading: loadingGet, 
    // error: errorGet,
    data: frameSideFileRelDetails, } = (0, api_1.useQuery)(getFrameFileObjectsQuery_graphql_1.default, { variables: { frameSideId } });
    if (loadingGet) {
        return <loader_1.default />;
    }
    const cachedFileRel = (0, files_1.getFrameSideFile)({
        frameSideId,
        hiveId,
    });
    let frameSideFileRel = {
        ...cachedFileRel,
        ...frameSideFileRelDetails.hiveFrameSideFile,
    };
    if (cachedFileRel) {
        cachedFileRel.strokeHistory = frameSideFileRel.strokeHistory;
    }
    const [linkFileToFrame] = (0, api_1.useMutation)(addFileToFrameSideMutation_graphql_1.default);
    function onResize(key, value) {
        let total = frameSide.broodPercent +
            frameSide.cappedBroodPercent +
            frameSide.droneBroodPercent +
            frameSide.honeyPercent +
            frameSide.pollenPercent;
        if (total <= 100) {
            onFrameSideStatChange(key, Math.round(1 * value));
        }
        else if (total > 100) {
            onFrameSideStatChange(key, Math.floor((100 * value) / total));
            if (key !== 'broodPercent')
                onFrameSideStatChange('broodPercent', Math.round((100 * frameSide.broodPercent) / total));
            if (key !== 'cappedBroodPercent')
                onFrameSideStatChange('cappedBroodPercent', Math.round((100 * frameSide.cappedBroodPercent) / total));
            if (key !== 'droneBroodPercent')
                onFrameSideStatChange('droneBroodPercent', Math.round((100 * frameSide.droneBroodPercent) / total));
            if (key !== 'honeyPercent')
                onFrameSideStatChange('honeyPercent', Math.round((100 * frameSide.honeyPercent) / total));
            if (key !== 'pollenPercent')
                onFrameSideStatChange('pollenPercent', Math.round((100 * frameSide.pollenPercent) / total));
        }
    }
    const extraButtons = (<div style={{ display: 'flex' }}>
			<button_1.default onClick={onFrameClose}>Close</button_1.default>
			<button_1.default title="Toggle queen" onClick={onQueenToggle}>
				<crownIcon_1.default fill={frameSide.queenDetected ? 'white' : '#555555'}/>
				Toggle Queen
			</button_1.default>
		</div>);
    if (!frameSideFileRel.file) {
        return (<div style={{ flexGrow: 10, paddingLeft: 15 }}>
				{extraButtons}
				<uploadFile_1.default onUpload={(data) => {
                if (frameSide.id) {
                    linkFileToFrame({
                        fileId: data.id,
                        frameSideId: frameSide.id,
                        hiveId,
                    });
                }
                onUpload(data);
            }}/>
			</div>);
    }
    return (<div style={{ marginLeft: 15 }}>
			<div className={styles_less_1.default.body}>
				<drawingCanvas_1.default imageUrl={frameSideFileRel.file.url} detectedObjects={frameSideFileRel.detectedObjects} strokeHistory={frameSideFileRel.strokeHistory} onStrokeHistoryUpdate={(strokeHistory) => {
            (0, files_2.setFileStroke)({
                frameSideId,
                hiveId,
                strokeHistory,
            });
        }}>
					<div style={{ display: expanded ? 'block' : 'flex', flexGrow: '1' }}>
						<resourceEditRow_1.default expanded={expanded} onClick={() => expand(!expanded)} title={'Brood'} color={colors_1.default.broodColor} percent={frameSide.broodPercent} onChange={(e) => onResize('broodPercent', e.target.value)}/>

						<resourceEditRow_1.default expanded={expanded} onClick={() => expand(!expanded)} title={'Capped Brood'} color={colors_1.default.cappedBroodColor} percent={frameSide.cappedBroodPercent} onChange={(e) => onResize('cappedBroodPercent', e.target.value)}/>

						<resourceEditRow_1.default expanded={expanded} onClick={() => expand(!expanded)} title={'Drone brood'} color={colors_1.default.droneBroodColor} percent={frameSide.droneBroodPercent} onChange={(e) => onResize('droneBroodPercent', e.target.value)}/>
						<resourceEditRow_1.default expanded={expanded} onClick={() => expand(!expanded)} title={'Honey'} color={colors_1.default.honeyColor} percent={frameSide.honeyPercent} onChange={(e) => onResize('honeyPercent', e.target.value)}/>

						<resourceEditRow_1.default expanded={expanded} onClick={() => expand(!expanded)} title={'Pollen'} color={colors_1.default.pollenColor} percent={frameSide.pollenPercent} onChange={(e) => onResize('pollenPercent', e.target.value)}/>
					</div>

					{extraButtons}
				</drawingCanvas_1.default>
			</div>
		</div>);
};
