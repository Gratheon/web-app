"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const index_less_1 = __importDefault(require("./index.less"));
const boxFrameHalf_1 = __importDefault(require("./boxFrameHalf"));
exports.default = ({ boxPosition, boxSelected, frameSelected, frameSide, apiaryId, hiveId, frame, }) => {
    const selectedFrame = boxPosition === boxSelected && frame.position === frameSelected;
    let frameInternal = null;
    // 'VOID','FOUNDATION','EMPTY_COMB','PARTITION','FEEDER'
    if (frame.type === 'VOID') {
        frameInternal = <div className={index_less_1.default.voidFrame}/>;
    }
    else if (frame.type === 'PARTITION') {
        frameInternal = <div className={index_less_1.default.partition}/>;
    }
    else if (frame.type === 'FEEDER') {
        frameInternal = <div className={index_less_1.default.feeder}/>;
    }
    else if (frame.type === 'FOUNDATION') {
        frameInternal = (<div style="background-color:#323232;display:flex;flex-grow:1;">
				<div style="flex-grow:1"/>
				<div className={index_less_1.default.foundation}/>
				<div style="flex-grow:1"/>
			</div>);
    }
    else if (frame.type === 'EMPTY_COMB') {
        frameInternal = (<div className={index_less_1.default.emptyComb}>
				<boxFrameHalf_1.default className={index_less_1.default.left} href={`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxPosition}/frame/${frame.position}/left`} frameSide={frame.leftSide}/>

				<div className={index_less_1.default.foundation}/>

				<boxFrameHalf_1.default className={index_less_1.default.right} href={`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxPosition}/frame/${frame.position}/right`} frameSide={frame.rightSide}/>
			</div>);
    }
    return (<div className={`${index_less_1.default.frame} ${selectedFrame && index_less_1.default.frameSelected}`}>
			<span className={`${index_less_1.default.position} 
				${selectedFrame && !frameSide && index_less_1.default.positionSelected}
				${selectedFrame && frameSide === 'left' && index_less_1.default.positionSelectedLeft}
				${selectedFrame && frameSide === 'right' && index_less_1.default.positionSelectedRight}
				`}>
				{frame.id}
			</span>
			{frameInternal}
		</div>);
};
