import {gql, useQuery} from '@/api'
import Loading from '@/shared/loader'
import ErrorMsg from '@/shared/messageError'
import { useMemo } from 'react'
import WindChart from './WindChart'
import RainChart from './RainChart'
import SolarRadiationChart from './SolarRadiationChart'
import CloudCoverChart from './CloudCoverChart'
import PollenChart from './PollenChart'
import PollutionChart from './PollutionChart'

const HISTORICAL_WEATHER_QUERY = gql`
	query historicalWeather($lat: String!, $lng: String!, $startDate: String!, $endDate: String!) {
		historicalWeather(lat: $lat, lng: $lng, startDate: $startDate, endDate: $endDate) {
			solarRadiation {
				diffuse_radiation { time value }
				direct_radiation { time value }
			}
			wind {
				wind_speed_10m { time value }
				wind_gusts_10m { time value }
			}
			cloudCover {
				cloud_cover_low { time value }
				cloud_cover_mid { time value }
				cloud_cover_high { time value }
			}
			rain {
				rain { time value }
			}
			pollen {
				ragweed_pollen { time value }
				alder_pollen { time value }
				birch_pollen { time value }
				grass_pollen { time value }
				mugwort_pollen { time value }
				olive_pollen { time value }
			}
			pollution {
				pm2_5 { time value }
				pm10 { time value }
			}
		}
	}
`

type HistoricalWeatherProps = {
	lat: string
	lng: string
	days: number
	chartRefs?: React.MutableRefObject<any[]>
	syncCharts?: (sourceChart: any) => void
}

export default function HistoricalWeather({lat, lng, days, chartRefs, syncCharts}: HistoricalWeatherProps) {
	const { startDate, endDate } = useMemo(() => {
		const end = new Date()
		const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
		return {
			startDate: start.toISOString().split('T')[0],
			endDate: end.toISOString().split('T')[0]
		}
	}, [days])

	const {loading, error, data} = useQuery(HISTORICAL_WEATHER_QUERY, {
		variables: {lat, lng, startDate, endDate},
	})

	if (loading) {
		return <Loading/>
	}

	if (!data?.historicalWeather) {
		return <ErrorMsg error={'could not load historical weather data'}/>
	}

	if (error) {
		return <ErrorMsg error={error}/>
	}

	const weatherData = data.historicalWeather

	return (
		<>


			<WindChart
				windData={weatherData.wind}
				chartRefs={chartRefs}
				syncCharts={syncCharts}
			/>

			<RainChart
				rainData={weatherData.rain}
				chartRefs={chartRefs}
				syncCharts={syncCharts}
			/>

			<SolarRadiationChart
				solarData={weatherData.solarRadiation}
				chartRefs={chartRefs}
				syncCharts={syncCharts}
			/>

			<CloudCoverChart
				cloudData={weatherData.cloudCover}
				chartRefs={chartRefs}
				syncCharts={syncCharts}
			/>

			<PollenChart
				pollenData={weatherData.pollen}
				chartRefs={chartRefs}
				syncCharts={syncCharts}
			/>

			<PollutionChart
				pollutionData={weatherData.pollution}
				chartRefs={chartRefs}
				syncCharts={syncCharts}
			/>
		</>
	)
}

