"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const popupButton_1 = require("../../../shared/popupButton");
const visualForm_1 = __importDefault(require("../../../shared/visualForm"));
const hiveIcon_1 = __importDefault(require("../../../shared/hiveIcon"));
const deleteButton_1 = __importDefault(require("../deleteButton"));
const createInspection_1 = __importDefault(require("../createInspection"));
const queenColor_1 = __importDefault(require("./queenColor"));
const button_1 = __importDefault(require("../../../shared/button"));
function HiveEditDetails({ apiaryId, hive, boxes, onQueenYearChange, onRaceChange, onSubmit, onNotesChange, onInput, }) {
    return (<div style={{ padding: '20px', display: 'flex' }}>
			<div style="width: 68px;text-align: center; margin-right:10px;">
				<hiveIcon_1.default hive={hive} boxes={boxes} editable={true}/>
			</div>
			<visualForm_1.default onSubmit={onSubmit} style="flex-grow:1">
				<div>
					<label htmlFor="name">Name</label>
					<input name="name" id="name" style="flex-grow:1" autoFocus value={hive.name} onInput={onInput}/>

					<popupButton_1.PopupButtonGroup className="green">
						<button_1.default type="submit">Save</button_1.default>
						<popupButton_1.PopupButton color={'black'} className="green">
							<createInspection_1.default apiaryId={apiaryId} inspections={hive.inspections} onBeforeSave={onSubmit} hive={hive}/>

							<deleteButton_1.default hiveId={hive.id} apiaryId={apiaryId}/>
						</popupButton_1.PopupButton>
					</popupButton_1.PopupButtonGroup>
				</div>
				<div>
					<label htmlFor="race">Queen</label>

					<input name="race" id="race" placeholder="race" value={hive.family ? hive.family.race : ''} onInput={onRaceChange}/>

					<input name="queenYear" id="queenYear" minLength={4} maxLength={4} style="width:40px;" placeholder="year" value={hive.family ? hive.family.added : ''} onInput={onQueenYearChange}/>

					<queenColor_1.default year={hive.family?.added}/>
				</div>


				<div>
					<label htmlFor="notes">Notes</label>
					<textarea style={{
            background: hive.notes ? '#EEE' : 'white',
            width: 'calc( 100% - 40px )',
            minHeight: hive.notes ? 32 : 20,
            padding: 10,
            borderRadius: 5,
            border: '1px solid gray',
        }} name="notes" id="notes" placeholder="Notes" value={hive.notes} onChange={onNotesChange}/>
				</div>
			</visualForm_1.default>
		</div>);
}
exports.default = HiveEditDetails;
