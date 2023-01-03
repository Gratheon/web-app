"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const api_1 = require("../../api");
const loader_1 = __importDefault(require("../loader"));
const forecast_1 = __importDefault(require("./forecast"));
const messageError_1 = __importDefault(require("../messageError"));
function Weather({ lat, lng }) {
    let { loading, error, data } = (0, api_1.useQuery)((0, api_1.gql) `
			query weather($lat: String!, $lng: String!) {
				weather(lat: $lat, lng: $lng)
			}
		`, { variables: { lat: `${lat}`, lng: `${lng}` } });
    if (!data?.weather) {
        return <messageError_1.default error={'could not load weather'}/>;
    }
    if (error) {
        return <messageError_1.default error={error}/>;
    }
    if (loading) {
        return <loader_1.default />;
    }
    return (<div style="padding:0 30px;">
			<div>Temperature: {data.weather?.current_weather.temperature} °C</div>
			<div>Windspeed: {data.weather?.current_weather.windspeed} km/h</div>

			<forecast_1.default data={data}/>
		</div>);
}
exports.default = Weather;
