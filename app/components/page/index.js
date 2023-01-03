"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_1 = require("react-router");
const apiaryCreate_1 = __importDefault(require("./apiaryCreate"));
const apiaryEdit_1 = __importDefault(require("./apiaryEdit"));
const apiaryList_1 = __importDefault(require("./apiaryList"));
const hiveCreate_1 = __importDefault(require("./hiveCreate"));
const hiveEdit_1 = __importDefault(require("./hiveEdit"));
const inspectionView_1 = __importDefault(require("./inspectionView"));
const accountEdit_1 = __importDefault(require("./accountEdit"));
const accountAuth_1 = __importDefault(require("./accountAuth"));
const accountRegister_1 = __importDefault(require("./accountRegister"));
function Page() {
    return (<div style="flex-grow:1;">
			<react_router_1.Routes>
				<react_router_1.Route path="/account/authenticate" element={<accountAuth_1.default />}/>
				<react_router_1.Route path="/account/register" element={<accountRegister_1.default />}/>

				<react_router_1.Route path="/apiaries/create" element={<apiaryCreate_1.default />}/>
				<react_router_1.Route path="/apiaries/edit/:id" element={<apiaryEdit_1.default />}/>
				<react_router_1.Route path="/" element={<apiaryList_1.default />}/>
				<react_router_1.Route path="/apiaries/" element={<apiaryList_1.default />}/>

				<react_router_1.Route path="/apiaries/:id/hives/add" element={<hiveCreate_1.default />}/>
				<react_router_1.Route path="/apiaries/:apiaryId/hives/:hiveId" element={<hiveEdit_1.default />}/>
				<react_router_1.Route path="/apiaries/:apiaryId/hives/:hiveId/box/:boxSelected" element={<hiveEdit_1.default />}/>
				<react_router_1.Route path="/apiaries/:apiaryId/hives/:hiveId/box/:boxSelected/frame/:frameSelected" element={<hiveEdit_1.default />}/>
				<react_router_1.Route path="/apiaries/:apiaryId/hives/:hiveId/box/:boxSelected/frame/:frameSelected/:frameSide" element={<hiveEdit_1.default />}/>

				<react_router_1.Route path="/apiaries/:apiaryId/hives/:hiveId/inspections/:inspectionId" element={<inspectionView_1.default />}/>
				<react_router_1.Route path="/account" element={<accountEdit_1.default />}/>
				<react_router_1.Route path="/account/:stripeStatus" element={<accountEdit_1.default />}/>
			</react_router_1.Routes>
		</div>);
}
exports.default = Page;
