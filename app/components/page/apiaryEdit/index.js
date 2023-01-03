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
const preact_1 = require("preact");
const react_router_dom_1 = require("react-router-dom");
const react_router_1 = require("react-router");
const visualForm_1 = __importDefault(require("../../shared/visualForm"));
const api_1 = require("../../api");
const loader_1 = __importDefault(require("../../shared/loader"));
const messageError_1 = __importDefault(require("../../shared/messageError"));
const messageSuccess_1 = __importDefault(require("../../shared/messageSuccess"));
const VisualFormSubmit_1 = __importDefault(require("../../shared/visualForm/VisualFormSubmit"));
const button_1 = __importDefault(require("../../shared/button"));
const map_1 = __importDefault(require("../../shared/map"));
const weather_1 = __importDefault(require("../../shared/weather"));
const plants_1 = __importDefault(require("../../shared/plants"));
class ApiaryEditForm extends preact_1.Component {
    render() {
        let navigate = (0, react_router_1.useNavigate)();
        let { id } = (0, react_router_dom_1.useParams)();
        let [autoLocate, setAutoLocate] = (0, react_1.useState)(false);
        let { loading: loadingGet, error: errorGet, data: apiaryGet, } = (0, api_1.useQuery)((0, api_1.gql) `
				query apiary($id: ID!) {
					apiary(id: $id) {
						id
						name
						lat
						lng
					}
				}
			`, { variables: { id } });
        let [deactivateApiary] = (0, api_1.useMutation)((0, api_1.gql) `
			mutation deactivateApiary($id: ID!) {
				deactivateApiary(id: $id)
			}
		`);
        let [updateApiary, { loading, error, data }] = (0, api_1.useMutation)((0, api_1.gql) `
			mutation updateApiary($id: ID!, $apiary: ApiaryInput!) {
				updateApiary(id: $id, apiary: $apiary) {
					id
				}
			}
		`);
        if (apiaryGet && !this.state.apiary) {
            this.setState({
                apiary: apiaryGet.apiary,
            });
        }
        const apiary = this.state.apiary;
        if (!apiary || loading || loadingGet) {
            return <loader_1.default />;
        }
        async function onDeleteApiary() {
            await deactivateApiary({
                id,
            });
            navigate(`/apiaries`, { replace: true });
        }
        function onSubmit(e) {
            e.preventDefault();
            updateApiary({
                id,
                apiary: {
                    name: this.state.apiary.name,
                    lat: `${this.state.apiary.lat}`,
                    lng: `${this.state.apiary.lng}`,
                },
            });
        }
        if (errorGet) {
            return <messageError_1.default error={errorGet}/>;
        }
        function onNameChange(e) {
            this.setState({
                apiary: {
                    ...this.state.apiary,
                    name: e.target.value,
                },
            });
        }
        let errorMsg;
        let okMsg;
        if (error) {
            errorMsg = <messageError_1.default error={error}/>;
        }
        if (data) {
            okMsg = <messageSuccess_1.default />;
        }
        return (<div>
				{okMsg}
				{errorMsg}

				<map_1.default lat={apiary.lat} lng={apiary.lng} autoLocate={autoLocate} onMarkerSet={(coords) => {
                this.setState({
                    apiary: {
                        ...apiaryGet.apiary,
                        ...coords,
                    },
                });
            }}/>

				<visualForm_1.default style="padding:20px;" onSubmit={onSubmit.bind(this)}>
					<div>
						<label htmlFor="name">Name</label>
						<input name="name" id="name" style={{ width: '100%' }} value={apiary.name} autoFocus onInput={onNameChange.bind(this)} ref={(input) => {
                this.nameInput = input;
            }}/>
					</div>
					<div>
						<label htmlFor="name">Location</label>
						<div>
							<a target="_blank" href={`https://www.google.com/maps/@${apiary.lat},${apiary.lng},16z/data=!3m1!1e3`} rel="noreferrer">
								Google maps
							</a>
							<button_1.default style="margin-left:20px" onClick={() => {
                setAutoLocate(!autoLocate);
            }}>
								Locate me
							</button_1.default>
						</div>
					</div>

					<VisualFormSubmit_1.default>
						<button_1.default type="submit" class="green">
							Update
						</button_1.default>
						<button_1.default style="margin-left:5px;" className="red" onClick={onDeleteApiary}>
							Delete
						</button_1.default>
					</VisualFormSubmit_1.default>
				</visualForm_1.default>

				{apiary && <weather_1.default lat={apiary.lat} lng={apiary.lng}/>}
				{apiary && <plants_1.default lat={apiary.lat} lng={apiary.lng}/>}
			</div>);
    }
}
exports.default = ApiaryEditForm;
