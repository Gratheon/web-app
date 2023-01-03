"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const hiveIcon_1 = __importDefault(require("../../../shared/hiveIcon"));
const link_1 = __importDefault(require("../../../shared/link"));
const hivesPlaceholder_1 = __importDefault(require("../../../shared/hivesPlaceholder"));
const addHive_1 = __importDefault(require("../../../../icons/addHive"));
const handIcon_1 = __importDefault(require("../../../../icons/handIcon"));
const index_less_1 = __importDefault(require("./index.less"));
function apiaryListRow(props) {
    const { apiary } = props;
    return (<div className={index_less_1.default.apiary}>
			<div className={index_less_1.default.apiaryHead}>
				<h2>{apiary.name ? apiary.name : '...'}</h2>
				<div style="margin-top:15px;">
					<link_1.default href={`/apiaries/edit/${apiary.id}`}>
						<handIcon_1.default /> Edit
					</link_1.default>
					<link_1.default href={`/apiaries/${apiary.id}/hives/add`}>
						<addHive_1.default /> Add hive
					</link_1.default>
				</div>
			</div>

			<div className={index_less_1.default.hives}>
				{apiary.hives && apiary.hives.length == 0 && <hivesPlaceholder_1.default />}
				{apiary.hives &&
            apiary.hives.map((hive, i) => (<div key={i} className={index_less_1.default.hive}>
							<a href={`/apiaries/${apiary.id}/hives/${hive.id}`}>
								<hiveIcon_1.default hive={hive} boxes={hive.boxes} size={60}/>
								<div className={index_less_1.default.title}>{hive.name}</div>
							</a>
						</div>))}
			</div>
		</div>);
}
exports.default = apiaryListRow;
