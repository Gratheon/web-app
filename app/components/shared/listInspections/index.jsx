"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const journalItem_1 = __importDefault(require("./journalItem"));
const react_1 = __importDefault(require("react"));
function listInspections({ selectedInspectionId, inspections, hive, editable = false, inspectionData, apiaryId, }) {
    if (!inspections || !inspections.length) {
        return (<div style={{
                color: 'gray',
                fontSize: '12px',
                padding: '5px 100px',
            }}>
				No inspection yet. Create one to track hive development in time
			</div>);
    }
    return (<div style={{ padding: "0 20px" }}>
			<h3>Inspection history</h3>

			<div style={{ flexGrow: 1, display: "flex" }}>
				{inspections.map((inspection) => (<journalItem_1.default selected={selectedInspectionId == inspection.id} apiaryId={apiaryId} hiveId={hive.id} id={inspection.id} key={inspection.id} data={inspection.data} added={inspection.added}/>))}
			</div>
		</div>);
}
exports.default = listInspections;
