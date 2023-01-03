"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const link_1 = __importDefault(require("../../shared/link"));
const api_1 = require("../../api");
const apiaryListRow_1 = __importDefault(require("./apiaryListRow"));
const loader_1 = __importDefault(require("../../shared/loader"));
const apiariesPlaceholder_1 = __importDefault(require("./apiariesPlaceholder"));
const messageError_1 = __importDefault(require("../../shared/messageError"));
function ApiaryList(props) {
    const { loading, error, data } = (0, api_1.useQuery)((0, api_1.gql) `
		{
			apiaries {
				id
				name

				hives {
					id
					name
					boxCount

					boxes {
						id
						position
						color
						type
					}
				}
			}
		}
	`);
    const { data: apiaryUpdated } = (0, api_1.useSubscription)((0, api_1.gql) `
		subscription onApiaryUpdated {
			onApiaryUpdated {
				id
				name
			}
		}
	`);
    if (error) {
        return <messageError_1.default error={error}/>;
    }
    if (loading) {
        return <loader_1.default />;
    }
    const { apiaries } = data;
    return (<div style="max-width:800px;padding-left:20px;">
			{!apiaries || (apiaries.length === 0 && <apiariesPlaceholder_1.default />)}

			{apiaries &&
            apiaries.map((apiary, i) => (<apiaryListRow_1.default key={i} apiary={apiary} selectedId={props.id}/>))}

			<div style="text-align: center;margin-top: 20px;">
				<link_1.default href="/apiaries/create">Add another apiary</link_1.default>
			</div>
		</div>);
}
exports.default = ApiaryList;
