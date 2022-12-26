import { format } from 'date-fns'
import React from 'react'
import LineChart from 'recharts/lib/chart/LineChart';
import Line from 'recharts/lib/cartesian/Line';
import XAxis from 'recharts/lib/cartesian/XAxis';
import YAxis from 'recharts/lib/cartesian/YAxis';
import CartesianGrid from 'recharts/lib/cartesian/CartesianGrid';
import Tooltip from 'recharts/lib/component/Tooltip';
import Legend from 'recharts/lib/component/Legend';

export default function Forecast({ data }) {
	const formattedData = []
	const humidity = []

	if (!data?.weather?.hourly) {
		return null
	}

	data.weather.hourly.time.map((hour, i) => {
		formattedData.push({
			name: format(new Date(hour), 'hh:mm(dd.MM)'),
			temperature: data.weather.hourly.temperature_2m[i],
			wind: data.weather.hourly.windspeed_10m[i],
		})
		humidity.push({
			name: format(new Date(hour), 'hh:mm(dd.MM)'),
			humidity: data.weather.hourly.relativehumidity_2m[i],
			rain: data.weather.hourly.rain[i],
		})
	})

	return (
		<div style="margin-top:20px">
			<div style="display:flex;">
				<LineChart
					width={600}
					height={300}
					data={formattedData}
					margin={{
						top: 5,
						right: 10,
						left: 10,
						bottom: 5,
					}}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="name" />
					<YAxis />
					<Tooltip />
					<Legend />
					<Line
						type="monotone"
						dataKey="temperature"
						stroke="#EEAAAA"
						activeDot={{ r: 2 }}
					/>
					<Line type="monotone" dataKey="wind" stroke="#82ca9d" />
				</LineChart>

				<LineChart
					width={600}
					height={300}
					data={humidity}
					margin={{
						top: 5,
						right: 10,
						left: 10,
						bottom: 5,
					}}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis dataKey="name" />
					<YAxis yAxisId="left" />
					<YAxis yAxisId="right" orientation="right" />
					<Tooltip />
					<Legend />
					<Line
						yAxisId="left"
						type="monotone"
						dataKey="humidity"
						stroke="#8884d8"
						activeDot={{ r: 2 }}
					/>
					<Line
						yAxisId="right"
						type="monotone"
						dataKey="rain"
						stroke="#82ca9d"
						activeDot={{ r: 2 }}
					/>
				</LineChart>
			</div>
		</div>
	)
}
