import React from 'react'

import { gql, useQuery } from '../../api'
import Loading from '../loader'
import Forecast from './forecast'
import ErrorMsg from '../messageError'
import {isEstonia} from "@/page/apiaryEdit";
import {CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis} from "recharts";
import {format} from "date-fns";

const WEATHER_QUERY = gql`
	query weather($lat: String!, $lng: String!) {
		weather(lat: $lat, lng: $lng)
	}
`

const WEATHER_ESTONIA_QUERY = gql`
	query weather($lat: String!, $lng: String!) {
		weatherEstonia(lat: $lat, lng: $lng)
	}
`

export default function Weather({ lat, lng }: { lat: any; lng: any }) {
	if(!lat) return
	if(!lng) return

	if (isEstonia(lat, lng)) {
		let { loading, error, data } = useQuery(WEATHER_ESTONIA_QUERY, {
			variables: { lat: `${lat}`, lng: `${lng}` },
		})

		if (loading) {
			return <Loading />
		}

		if (!data?.weatherEstonia) {
			return <ErrorMsg error={'could not load weather'} />
		}

		if (error) {
			return <ErrorMsg error={error} />
		}

		let formattedData = []

		data.weatherEstonia.days.map((day: any, i: number) => {
			console.log(day)
			formattedData.push({
				name: day,
				temperature: data.weatherEstonia.temp[i],
			})
		})
		console.log(data.weatherEstonia)
		return (
			<div style={{ padding: '0 10px' }}>
				<h1>{data.weatherEstonia.closestLocation}</h1>

				{/*{data.weatherEstonia.data.map((day: any) => (*/}
				{/*	<>*/}
				{/*		<h2>{day.date}</h2>*/}
				{/*		<div>{day.day.phenomenon}</div>*/}
				{/*		<div>Temp: {day.day.temp.min}</div>*/}
				{/*		<div>Wind: {day.day.wind.min}</div>*/}
				{/*	</>*/}
				{/*))}*/}


				<LineChart
					width={400}
					height={200}
					data={formattedData}
					margin={{
						top: 5,
						right: 10,
						left: 10,
						bottom: 5,
					}}
				>
					<CartesianGrid strokeDasharray="3 3"/>
					<XAxis dataKey="name"/>
					<YAxis/>
					<Tooltip/>
					{/*<Legend/>*/}
					<Line
						type="monotone"
						dataKey="temperature"
						stroke="#EEAAAA"
						activeDot={{r: 2}}
					/>
				</LineChart>

			</div>
		)
	}

	let { loading, error, data } = useQuery(WEATHER_QUERY, {
		variables: { lat: `${lat}`, lng: `${lng}` },
	})

	if (loading) {
		return <Loading />
	}

	if (!data?.weather) {
		return <ErrorMsg error={'could not load weather'} />
	}

	if (error) {
		return <ErrorMsg error={error} />
	}

	return (
		<div style={{ padding: '0 10px' }}>
			<Forecast data={data}/>
		</div>
	)}
