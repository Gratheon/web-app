"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const link_1 = __importDefault(require("../../link"));
const dateFormat_1 = __importDefault(require("../../dateFormat"));
const react_1 = __importDefault(require("react"));
const colors_1 = __importDefault(require("../../../colors"));
const styles_less_1 = __importDefault(require("./styles.less"));
function journalItem({ selected = false, apiaryId, data, hiveId, added, id, }) {
    let tmpdata = JSON.parse(data);
    let stats = tmpdata.stats;
    stats.brood = Math.round(stats.brood * 5);
    stats.honey = Math.round(stats.honey * 5);
    return (<div className={`${styles_less_1.default.journalItem} ${selected ? styles_less_1.default.journalItemSelected : ''}`}>
			<link_1.default href={`/apiaries/${apiaryId}/hives/${hiveId}/inspections/${id}`}>
				<dateFormat_1.default datetime={added}/>
				<div className={styles_less_1.default.journalItemStats}>
					<div style={{
            backgroundColor: colors_1.default.broodColor,
            height: stats.brood
        }}></div>
					<div style={{
            backgroundColor: colors_1.default.honeyColor,
            height: stats.honey,
            borderTop: "1px solid #ffAA00;"
        }}></div>
				</div>
			</link_1.default>
		</div>);
}
exports.default = journalItem;
