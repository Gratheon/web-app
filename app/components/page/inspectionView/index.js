"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../../api");
const inspectionQuery_graphql_1 = __importDefault(require("./inspectionQuery.graphql"));
const loader_1 = __importDefault(require("../../shared/loader"));
const dateFormat_1 = __importDefault(require("../../shared/dateFormat"));
const boxes_1 = __importDefault(require("../hiveEdit/boxes"));
const react_1 = __importDefault(require("react"));
const link_1 = __importDefault(require("../../shared/link"));
const messageError_1 = __importDefault(require("../../shared/messageError"));
const listInspections_1 = __importDefault(require("../../shared/listInspections"));
exports.default = ({ apiaryId, hiveId, inspectionId }) => {
    let { loading: loadingGet, error: errorGet, data: inspectionGet, } = (0, api_1.useQuery)(inspectionQuery_graphql_1.default, {
        variables: {
            inspectionId: inspectionId,
            hiveId: hiveId,
        },
    });
    if (loadingGet) {
        return <loader_1.default />;
    }
    if (errorGet) {
        return <messageError_1.default error={errorGet}/>;
    }
    let { inspection, hive } = inspectionGet;
    const inspectionData = JSON.parse(inspection.data);
    return (<div>
			<h1>
				<link_1.default href={`/apiaries/${apiaryId}/hives/${hiveId}`} className={null}>
					Hive {hive.name}
				</link_1.default>{' '}
				/ inspection{' '}
				<dateFormat_1.default options={{
            month: 'long',
            day: '2-digit',
            year: 'numeric',
        }} datetime={inspectionGet.inspection.added}/>
			</h1>

			<listInspections_1.default selectedInspectionId={inspectionId} inspectionData={inspectionData} inspections={hive.inspections} editable={false} apiaryId={apiaryId} hive={hive}/>

			<boxes_1.default editable={false} hiveId={hive.id} boxes={inspectionData.boxes} frames={inspectionData.frames} apiaryId={apiaryId} boxSelected={true}/>
		</div>);
};
