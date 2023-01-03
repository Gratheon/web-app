"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const button_1 = __importDefault(require("../../../shared/button"));
const hiveDeleteMutation_graphql_js_1 = __importDefault(require("./hiveDeleteMutation.graphql.js"));
const api_1 = require("../../../api");
const loader_1 = __importDefault(require("../../../shared/loader"));
const deleteIcon_1 = __importDefault(require("../../../../icons/deleteIcon"));
function deactivateButton({ hiveId }) {
    let [updateHive, { loading }] = (0, api_1.useMutation)(hiveDeleteMutation_graphql_js_1.default);
    let navigate = (0, react_router_dom_1.useNavigate)();
    function deactivate(e) {
        e.preventDefault();
        if (confirm('Are you sure?')) {
            updateHive({
                id: hiveId,
            }).then(() => {
                navigate(`/apiaries`, { replace: true });
            });
        }
    }
    if (loading) {
        return <loader_1.default />;
    }
    return (<button_1.default loading={loading} className="red" onClick={deactivate}>
			<deleteIcon_1.default /> Delete
		</button_1.default>);
}
exports.default = deactivateButton;
