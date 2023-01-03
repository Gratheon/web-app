"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const api_1 = require("../../api");
const loader_1 = __importDefault(require("../loader"));
const messageError_1 = __importDefault(require("../messageError"));
function Plants({ lat, lng }) {
    let { loading, error, data } = (0, api_1.useQuery)((0, api_1.gql) `
			query plants($lat: String!, $lng: String!) {
				plants(lat: $lat, lng: $lng){
					gbifID
					URL
					scientificName
					distance
					images {
						URL
						title
						source
						created
						creator
					}
				}
			}
		`, { variables: { lat: `${lat}`, lng: `${lng}` } });
    if (loading) {
        return <loader_1.default />;
    }
    if (!data?.plants) {
        return <messageError_1.default error={'could not load local plants'}/>;
    }
    if (error) {
        return <messageError_1.default error={error}/>;
    }
    console.log(data);
    return (<div style="padding:0 30px;">
			<h3>Local plants</h3>
			<div style="display:flex;">
				<div style="min-width:200px; font-size:10px;">
					{data.plants.map((plant) => {
            return <div><a href={plant.URL}>{plant.scientificName}</a></div>;
        })}
				</div>

				<div style="flex-grow:7">
					{data.plants.map((plant) => {
            return <div style="display:inline;">{plant.images.map((image) => {
                    return <img src={image.URL} title={image.title} style="height:100px"/>;
                })}</div>;
        })}
				</div>
			</div>
			{data.plants &&
            <div style="font-size:10px; color:gray;">
							Results are based on dataset by AFFOUARD A, JOLY A, LOMBARDO J, CHAMP J, GOEAU H, BONNET P (2022) et al.
							Pl@ntNet automatically identified occurrences.
							Version 1.3. Pl@ntNet. via <i>GBIF.org (31 October 2022) GBIF Occurrence Download https://doi.org/10.15468/dl.dn88uh</i>
						</div>}
		</div>);
}
exports.default = Plants;
