import React from 'react'

import { gql, useQuery } from '../../api'
import Loading from '../loader'
import Forecast from './forecast'
import ErrorMsg from '../messageError'

export default function Weather({ lat, lng }) {
	let { loading, error, data } = useQuery(
		gql`
			query weather($lat: String!, $lng: String!) {
				weather(lat: $lat, lng: $lng)
			}
		`,
		{ variables: { lat: `${lat}`, lng: `${lng}` } }
	)

	if (!data?.weather) {
		return <ErrorMsg error={'could not load weather'} />
	}

	if (error) {
		return <ErrorMsg error={error} />
	}

	if (loading) {
		return <Loading />
	}

	return (
		<div style="padding:0 30px;">
			<div>Temperature: {data.weather?.current_weather.temperature} °C</div>
			<div>Windspeed: {data.weather?.current_weather.windspeed} km/h</div>

			<Forecast data={data} />
		</div>
	)
}
