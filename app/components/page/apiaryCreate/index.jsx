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
const react_router_dom_1 = require("react-router-dom");
const api_1 = require("../../api");
const map_1 = __importDefault(require("../../shared/map"));
const visualForm_1 = __importDefault(require("../../shared/visualForm"));
const loader_1 = __importDefault(require("../../shared/loader"));
const messageError_1 = __importDefault(require("../../shared/messageError"));
const VisualFormSubmit_1 = __importDefault(require("../../shared/visualForm/VisualFormSubmit"));
const button_1 = __importDefault(require("../../shared/button"));
function ApiaryEditForm() {
    let navigate = (0, react_router_dom_1.useNavigate)();
    let [name, setName] = (0, react_1.useState)('');
    let [lat, setLat] = (0, react_1.useState)(0);
    let [lng, setLng] = (0, react_1.useState)(0);
    let [autoLocate, setAutoLocate] = (0, react_1.useState)(false);
    let [addApiary, { loading, error, data }] = (0, api_1.useMutation)((0, api_1.gql) `
		mutation addApiary($apiary: ApiaryInput!) {
			addApiary(apiary: $apiary) {
				id
				name
				lat
				lng
			}
		}
	`);
    function onSubmit(e) {
        e.preventDefault();
        addApiary({
            apiary: {
                name,
                lat: `${lat}`,
                lng: `${lng}`,
            },
        });
    }
    if (data) {
        navigate('/apiaries', { replace: true });
        return <div>Saved!</div>;
    }
    if (loading) {
        return <loader_1.default />;
    }
    let errorMsg;
    if (error) {
        errorMsg = <messageError_1.default error={error}/>;
    }
    return (<div style={{ padding: 20 }}>
			{errorMsg}

			<h2 style={{ marginBottom: 10 }}>New apiary</h2>
			<visualForm_1.default onSubmit={onSubmit}>
				<map_1.default lat={lat} lng={lng} autoLocate={autoLocate} onMarkerSet={(coords) => {
            setLat(coords.lat);
            setLng(coords.lng);
        }}/>
				<div>
					<label htmlFor="name">Name</label>
					<input name="name" id="name" style={{ width: '100%' }} autoFocus value={name} onInput={(e) => {
            setName(e.target.value);
        }}/>
				</div>

				<VisualFormSubmit_1.default>
					<button_1.default onClick={() => {
            setAutoLocate(!autoLocate);
        }}>
						Locate me
					</button_1.default>
					<button_1.default type="submit" className="green">
						Create
					</button_1.default>
				</VisualFormSubmit_1.default>
			</visualForm_1.default>
		</div>);
}
exports.default = ApiaryEditForm;
