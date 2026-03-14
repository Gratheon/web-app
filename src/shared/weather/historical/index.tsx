import {gql, useQuery} from '@/api'
import Loading from '@/shared/loader'
import ErrorMsg from '@/shared/messageError'
import { useMemo } from 'react'
import TemperatureChart from './TemperatureChart'
import WindChart from './WindChart'
import RainChart from './RainChart'
import SolarRadiationChart from './SolarRadiationChart'
import CloudCoverChart from './CloudCoverChart'
import PollenChart from './PollenChart'
import PollutionChart from './PollutionChart'

const HISTORICAL_WEATHER_QUERY = gql`
	query historicalWeatherCompact(
		$lat: String!
		$lng: String!
		$startDate: String!
		$endDate: String!
		$stepHours: Int!
		$includeTemperature: Boolean!
		$includeWind: Boolean!
		$includeRain: Boolean!
		$includeSolarRadiation: Boolean!
		$includeCloudCover: Boolean!
		$includePollen: Boolean!
		$includePollution: Boolean!
	) {
			historicalWeatherCompact(lat: $lat, lng: $lng, startDate: $startDate, endDate: $endDate, stepHours: $stepHours) {
				temperature @include(if: $includeTemperature) {
					temperature_2m { startTime endTime stepHours pointsCount values }
				}
				solarRadiation @include(if: $includeSolarRadiation) {
					diffuse_radiation { startTime endTime stepHours pointsCount values }
					direct_radiation { startTime endTime stepHours pointsCount values }
				}
				wind @include(if: $includeWind) {
					wind_speed_10m { startTime endTime stepHours pointsCount values }
					wind_gusts_10m { startTime endTime stepHours pointsCount values }
				}
				cloudCover @include(if: $includeCloudCover) {
					cloud_cover_low { startTime endTime stepHours pointsCount values }
					cloud_cover_mid { startTime endTime stepHours pointsCount values }
					cloud_cover_high { startTime endTime stepHours pointsCount values }
				}
				rain @include(if: $includeRain) {
					rain { startTime endTime stepHours pointsCount values }
				}
				pollen @include(if: $includePollen) {
					ragweed_pollen { startTime endTime stepHours pointsCount values }
					alder_pollen { startTime endTime stepHours pointsCount values }
					birch_pollen { startTime endTime stepHours pointsCount values }
					grass_pollen { startTime endTime stepHours pointsCount values }
					mugwort_pollen { startTime endTime stepHours pointsCount values }
					olive_pollen { startTime endTime stepHours pointsCount values }
				}
				pollution @include(if: $includePollution) {
					pm2_5 { startTime endTime stepHours pointsCount values }
					pm10 { startTime endTime stepHours pointsCount values }
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
	enabledCharts: {
		temperature: boolean
		wind: boolean
		rain: boolean
		solarRadiation: boolean
		cloudCover: boolean
		pollen: boolean
		pollution: boolean
	}
}

type CompactSeries = {
	startTime?: string | null
	endTime?: string | null
	stepHours: number
	pointsCount?: number
	values?: Array<number | null> | null
}

const expandCompactSeries = (series?: CompactSeries | null) => {
	if (!series?.startTime || !series.values) return []
	const base = Date.parse(`${series.startTime}:00Z`)
	if (Number.isNaN(base)) return []
	const stepMs = Math.max(1, series.stepHours) * 60 * 60 * 1000
	return series.values.map((value, index) => ({
		time: new Date(base + index * stepMs).toISOString().slice(0, 16),
		value
	}))
}

const transformCompactToChartData = (compactData: any) => ({
	temperature: {
		temperature_2m: expandCompactSeries(compactData.temperature?.temperature_2m),
	},
	solarRadiation: {
		diffuse_radiation: expandCompactSeries(compactData.solarRadiation?.diffuse_radiation),
		direct_radiation: expandCompactSeries(compactData.solarRadiation?.direct_radiation),
	},
	wind: {
		wind_speed_10m: expandCompactSeries(compactData.wind?.wind_speed_10m),
		wind_gusts_10m: expandCompactSeries(compactData.wind?.wind_gusts_10m),
	},
	cloudCover: {
		cloud_cover_low: expandCompactSeries(compactData.cloudCover?.cloud_cover_low),
		cloud_cover_mid: expandCompactSeries(compactData.cloudCover?.cloud_cover_mid),
		cloud_cover_high: expandCompactSeries(compactData.cloudCover?.cloud_cover_high),
	},
	rain: {
		rain: expandCompactSeries(compactData.rain?.rain),
	},
	pollen: {
		ragweed_pollen: expandCompactSeries(compactData.pollen?.ragweed_pollen),
		alder_pollen: expandCompactSeries(compactData.pollen?.alder_pollen),
		birch_pollen: expandCompactSeries(compactData.pollen?.birch_pollen),
		grass_pollen: expandCompactSeries(compactData.pollen?.grass_pollen),
		mugwort_pollen: expandCompactSeries(compactData.pollen?.mugwort_pollen),
		olive_pollen: expandCompactSeries(compactData.pollen?.olive_pollen),
	},
	pollution: {
		pm2_5: expandCompactSeries(compactData.pollution?.pm2_5),
		pm10: expandCompactSeries(compactData.pollution?.pm10),
	},
})

export default function HistoricalWeather({lat, lng, days, chartRefs, syncCharts, enabledCharts}: HistoricalWeatherProps) {
	const { startDate, endDate } = useMemo(() => {
		const end = new Date()
		const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
		return {
			startDate: start.toISOString().split('T')[0],
			endDate: end.toISOString().split('T')[0],
		}
	}, [days])
	const stepHours = 1

	const {loading, error, data} = useQuery(HISTORICAL_WEATHER_QUERY, {
		variables: {
			lat,
			lng,
			startDate,
			endDate,
			stepHours,
			includeTemperature: enabledCharts.temperature,
			includeWind: enabledCharts.wind,
			includeRain: enabledCharts.rain,
			includeSolarRadiation: enabledCharts.solarRadiation,
			includeCloudCover: enabledCharts.cloudCover,
			includePollen: enabledCharts.pollen,
			includePollution: enabledCharts.pollution,
		},
	})
	const weatherData = data?.historicalWeatherCompact
		? transformCompactToChartData(data.historicalWeatherCompact)
		: null

	if (loading) {
		return <Loading/>
	}

	if (!weatherData) {
		return <ErrorMsg error={'could not load historical weather data'}/>
	}

	if (error) {
		return <ErrorMsg error={error}/>
	}

	return (
		<>
			{enabledCharts.temperature && (
				<TemperatureChart
					temperatureData={weatherData.temperature}
					chartRefs={chartRefs}
					syncCharts={syncCharts}
				/>
			)}

			{enabledCharts.wind && (
				<WindChart
					windData={weatherData.wind}
					chartRefs={chartRefs}
					syncCharts={syncCharts}
				/>
			)}

			{enabledCharts.rain && (
				<RainChart
					rainData={weatherData.rain}
					chartRefs={chartRefs}
					syncCharts={syncCharts}
				/>
			)}

			{enabledCharts.solarRadiation && (
				<SolarRadiationChart
					solarData={weatherData.solarRadiation}
					chartRefs={chartRefs}
					syncCharts={syncCharts}
				/>
			)}

			{enabledCharts.cloudCover && (
				<CloudCoverChart
					cloudData={weatherData.cloudCover}
					chartRefs={chartRefs}
					syncCharts={syncCharts}
				/>
			)}

			{enabledCharts.pollen && (
				<PollenChart
					pollenData={weatherData.pollen}
					chartRefs={chartRefs}
					syncCharts={syncCharts}
				/>
			)}

			{enabledCharts.pollution && (
				<PollutionChart
					pollutionData={weatherData.pollution}
					chartRefs={chartRefs}
					syncCharts={syncCharts}
				/>
			)}
		</>
	)
}
