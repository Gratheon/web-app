"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
const react_1 = __importDefault(require("react"));
const LineChart_1 = __importDefault(require("recharts/lib/chart/LineChart"));
const Line_1 = __importDefault(require("recharts/lib/cartesian/Line"));
const XAxis_1 = __importDefault(require("recharts/lib/cartesian/XAxis"));
const YAxis_1 = __importDefault(require("recharts/lib/cartesian/YAxis"));
const CartesianGrid_1 = __importDefault(require("recharts/lib/cartesian/CartesianGrid"));
const Tooltip_1 = __importDefault(require("recharts/lib/component/Tooltip"));
const Legend_1 = __importDefault(require("recharts/lib/component/Legend"));
function Forecast({ data }) {
    const formattedData = [];
    const humidity = [];
    if (!data?.weather?.hourly) {
        return null;
    }
    data.weather.hourly.time.map((hour, i) => {
        formattedData.push({
            name: (0, date_fns_1.format)(new Date(hour), 'hh:mm(dd.MM)'),
            temperature: data.weather.hourly.temperature_2m[i],
            wind: data.weather.hourly.windspeed_10m[i],
        });
        humidity.push({
            name: (0, date_fns_1.format)(new Date(hour), 'hh:mm(dd.MM)'),
            humidity: data.weather.hourly.relativehumidity_2m[i],
            rain: data.weather.hourly.rain[i],
        });
    });
    return (<div style="margin-top:20px">
			<div style="display:flex;">
				<LineChart_1.default width={600} height={300} data={formattedData} margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 5,
        }}>
					<CartesianGrid_1.default strokeDasharray="3 3"/>
					<XAxis_1.default dataKey="name"/>
					<YAxis_1.default />
					<Tooltip_1.default />
					<Legend_1.default />
					<Line_1.default type="monotone" dataKey="temperature" stroke="#EEAAAA" activeDot={{ r: 2 }}/>
					<Line_1.default type="monotone" dataKey="wind" stroke="#82ca9d"/>
				</LineChart_1.default>

				<LineChart_1.default width={600} height={300} data={humidity} margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 5,
        }}>
					<CartesianGrid_1.default strokeDasharray="3 3"/>
					<XAxis_1.default dataKey="name"/>
					<YAxis_1.default yAxisId="left"/>
					<YAxis_1.default yAxisId="right" orientation="right"/>
					<Tooltip_1.default />
					<Legend_1.default />
					<Line_1.default yAxisId="left" type="monotone" dataKey="humidity" stroke="#8884d8" activeDot={{ r: 2 }}/>
					<Line_1.default yAxisId="right" type="monotone" dataKey="rain" stroke="#82ca9d" activeDot={{ r: 2 }}/>
				</LineChart_1.default>
			</div>
		</div>);
}
exports.default = Forecast;
