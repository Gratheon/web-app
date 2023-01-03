"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const date_fns_1 = require("date-fns");
const react_1 = __importDefault(require("react"));
const recharts_1 = require("recharts");
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
    return (<div style={{ marginTop: '20px' }}>
			<div style={{ display: 'flex' }}>
				<recharts_1.LineChart width={600} height={300} data={formattedData} margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 5,
        }}>
					<recharts_1.CartesianGrid strokeDasharray="3 3"/>
					<recharts_1.XAxis dataKey="name"/>
					<recharts_1.YAxis />
					<recharts_1.Tooltip />
					<recharts_1.Legend />
					<recharts_1.Line type="monotone" dataKey="temperature" stroke="#EEAAAA" activeDot={{ r: 2 }}/>
					<recharts_1.Line type="monotone" dataKey="wind" stroke="#82ca9d"/>
				</recharts_1.LineChart>

				<recharts_1.LineChart width={600} height={300} data={humidity} margin={{
            top: 5,
            right: 10,
            left: 10,
            bottom: 5,
        }}>
					<recharts_1.CartesianGrid strokeDasharray="3 3"/>
					<recharts_1.XAxis dataKey="name"/>
					<recharts_1.YAxis yAxisId="left"/>
					<recharts_1.YAxis yAxisId="right" orientation="right"/>
					<recharts_1.Tooltip />
					<recharts_1.Legend />
					<recharts_1.Line yAxisId="left" type="monotone" dataKey="humidity" stroke="#8884d8" activeDot={{ r: 2 }}/>
					<recharts_1.Line yAxisId="right" type="monotone" dataKey="rain" stroke="#82ca9d" activeDot={{ r: 2 }}/>
				</recharts_1.LineChart>
			</div>
		</div>);
}
exports.default = Forecast;
