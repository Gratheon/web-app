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
const react_router_1 = require("react-router");
const react_router_dom_1 = require("react-router-dom");
const api_1 = require("../../api");
const visualForm_1 = __importDefault(require("../../shared/visualForm"));
const hiveIcon_1 = __importDefault(require("../../shared/hiveIcon"));
const loader_1 = __importDefault(require("../../shared/loader"));
const messageError_1 = __importDefault(require("../../shared/messageError"));
const VisualFormSubmit_1 = __importDefault(require("../../shared/visualForm/VisualFormSubmit"));
const button_1 = __importDefault(require("../../shared/button"));
const defaultBoxColor = '#ffc848';
function HiveCreateForm() {
    let { id } = (0, react_router_dom_1.useParams)();
    let [boxCount, setBoxCount] = (0, react_1.useState)(2);
    let defaultBoxes = [];
    for (let i = 0; i < boxCount; i++) {
        defaultBoxes.push({
            color: `${defaultBoxColor}`,
        });
    }
    const [boxes, setBoxes] = (0, react_1.useState)(defaultBoxes);
    let navigate = (0, react_router_1.useNavigate)();
    let [frameCount, setFrameCount] = (0, react_1.useState)(8);
    let [name, setName] = (0, react_1.useState)('');
    let [addHive, { loading, error, data }] = (0, api_1.useMutation)((0, api_1.gql) `
			mutation addHive(
				$name: String!
				$boxCount: Int!
				$frameCount: Int!
				$apiaryId: ID!
				$colors: [String]
			) {
				addHive(
					hive: {
						name: $name
						boxCount: $boxCount
						frameCount: $frameCount
						apiaryId: $apiaryId
						colors: $colors
					}
				) {
					id
					name
					boxCount
				}
			}
		`, { errorPolicy: 'all' });
    function onSubmit(e) {
        e.preventDefault();
        addHive({
            apiaryId: id,
            name,
            boxCount,
            frameCount,
            colors: boxes.map((b) => {
                return b.color;
            }),
        });
    }
    if (loading) {
        return <loader_1.default />;
    }
    if (data) {
        navigate('/apiaries', { replace: true });
        return <div>Saved!</div>;
    }
    return (<div>
			{error && <messageError_1.default error={error}/>}
			<div style={{ display: 'flex', padding: 20 }}>
				<div style={{ paddingTop: 30, width: 100, textAlign: 'center' }}>
					<hiveIcon_1.default boxes={boxes} editable={true}/>
				</div>

				<visualForm_1.default onSubmit={onSubmit.bind(this)} style="flex-grow:1">
					<div>
						<label htmlFor="name">Name</label>
						<input name="name" id="name" style={{ flexGrow: '1' }} autoFocus value={name} onInput={(e) => setName(e.target.value)}/>
					</div>

					<div>
						<label htmlFor="boxCount">Box count</label>

						<input style={{ width: 50 }} type="number" id="boxCount" name="boxCount" value={boxCount} onInput={(e) => {
            const boxCount = parseInt(e.target.value, 10);
            if (boxCount < 1)
                return;
            setBoxCount(boxCount);
            if (boxCount > boxes.length) {
                setBoxes([...boxes, { color: defaultBoxColor }]);
            }
            else if (boxCount < boxes.length) {
                setBoxes([...boxes.slice(0, boxCount)]);
            }
        }} min="1" max="10" step="1"/>
					</div>

					<div>
						<label htmlFor="frameCount">Frame count</label>

						<input style={{ width: 50 }} type="number" id="frameCount" name="frameCount" value={frameCount} onInput={(e) => setFrameCount(parseInt(e.target.value, 10))} min="0" max="40" step="1"/>
					</div>

					<VisualFormSubmit_1.default>
						<button_1.default type="submit" className="green">
							Create
						</button_1.default>
					</VisualFormSubmit_1.default>
				</visualForm_1.default>
			</div>
		</div>);
}
exports.default = HiveCreateForm;
