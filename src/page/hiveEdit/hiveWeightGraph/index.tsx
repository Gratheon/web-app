import { Chart, AreaSeries, HistogramSeries, PriceLine } from 'lightweight-charts-react-components'

import { gql, useQuery } from '@/api'

import ChartHeading from '@/shared/chartHeading'
import Loader from '@/shared/loader'
import { formatTime } from '@/shared/dateTimeFormat'
import T, { useTranslation as t } from '@/shared/translate'
import { useLiveQuery } from 'dexie-react-hooks'
import { getUser } from '@/models/user'
import ErrorMsg from '@/shared/messageError'

const WEIGHT_QUERY = gql`
	query hiveWeight($hiveId: ID!, $timeRangeMin: Int) {
		weightKg(hiveId: $hiveId, timeRangeMin: $timeRangeMin) {
			... on MetricFloatList {
				metrics {
					t
					v
				}
			}

			... on TelemetryError {
				message
				code
			}
		}
		temperatureCelsius(hiveId: $hiveId, timeRangeMin: $timeRangeMin) {
			... on MetricFloatList {
				metrics {
					t
					v
				}
			}

			... on TelemetryError {
				message
				code
			}
		}
	}
`

const red = 'rgba(255,211,174,0.42)'
const green = 'rgba(126,207,36,0.83)'
const blue = '#8fddff'

export default function HiveWeightGraph({ hiveId }) {
	let userStored = useLiveQuery(() => getUser(), [], null)

	let {
		loading,
		error: errorGet,
		data,
		errorNetwork,
	} = useQuery(WEIGHT_QUERY, {
		variables: {
			hiveId,
			timeRangeMin: 7 * 60 * 24,
		},
	})

	if (loading || !userStored) {
		return <Loader />
	}

	let weightDiv = null
	let temperatureDiv = null
	let kgLabel = t('kg', 'Shortest label for the unit of weight in kilograms')

	const chartOptions = {
			layout: {
				attributionLogo: false,
			},
			timeScale: {
				timeVisible: true,
				secondsVisible: true,
			},
	}

	console.log({ data })

	if (!data.weightKg || data.weightKg.code) {
		if (data.weightKg?.code) {
			return <ErrorMsg error={data.weightKg} />
		}
		weightDiv = (
			<p style="color:#bbb">
				<T>Hive weight was not reported this week.</T>
			</p>
		)
	} else if (data.weightKg.metrics.length == 0) {
		weightDiv = (
			<p style="color:#bbb">
				<T>Hive weight was not reported this week.</T>
			</p>
		)
	} else {
		let formattedWeightData = []
		formattedWeightData = data.weightKg.metrics.map((row) => {
			const date = new Date(row.t)
			const timestamp = Math.floor(date.getTime() / 1000)
			return {
				time: timestamp,
				value: Math.round(row.v * 100) / 100,
			}
		})

		const sortedWeightData = formattedWeightData
			.sort((a, b) => a.time - b.time)
			.reduce((acc, curr) => {
				const lastItem = acc[acc.length - 1]
				if (!lastItem || lastItem.time !== curr.time) {
					acc.push(curr)
				} else {
					acc[acc.length - 1] = curr
				}
				return acc
			}, [])

		const histogramData = sortedWeightData.map((entry, index) => {
			const previousValue = index > 0 ? sortedWeightData[index - 1].value : entry.value
			const color = entry.value < previousValue ? red : green
			return {
				time: entry.time,
				value: entry.value,
				color: color
			}
		})

		let lastWeight =
			Math.round(
				100 * data.weightKg.metrics[data.weightKg.metrics.length - 1].v
			) / 100

		weightDiv = (
			<div style="padding-bottom: 20px;">
				<ChartHeading
					title={t('Hive Weight') + ' ⚖️️'}
					value={`${lastWeight} ${kgLabel}`}
					info={t(
						'Drop in hive weight may correlate with swarming or starvation'
					)}
				/>

				<Chart options={chartOptions} containerProps={{ style: { width: '100%', height: '200px' } }}>
					<HistogramSeries
						data={histogramData}
					/>
				</Chart>
			</div>
		)
	}

	if (!data.temperatureCelsius || data.temperatureCelsius.metrics.length == 0) {
		temperatureDiv = (
			<p style="color:#bbb">
				<T>Hive temperature was not reported this week.</T>
			</p>
		)
	} else {
		let lastTemperature =
			Math.round(
				100 *
					data.temperatureCelsius.metrics[
						data.temperatureCelsius.metrics.length - 1
					].v
			) / 100
		let minTemperature = Math.min(
			...data.temperatureCelsius.metrics.map((row) => row.v)
		)
		let maxTemperature = Math.max(
			...data.temperatureCelsius.metrics.map((row) => row.v)
		)

		let temperatureColor = green

		if (lastTemperature < 13) {
			temperatureColor = blue
		} else if (lastTemperature > 38) {
			temperatureColor = red
		}

		let formattedTemperatureData = []
		formattedTemperatureData = data.temperatureCelsius.metrics.map((row) => {
			const date = new Date(row.t)
			const timestamp = Math.floor(date.getTime() / 1000)
			return {
				time: timestamp,
				value: Math.round(row.v * 100) / 100,
			}
		})

		const sortedTemperatureData = formattedTemperatureData
			.sort((a, b) => a.time - b.time)
			.reduce((acc, curr) => {
				const lastItem = acc[acc.length - 1]
				if (!lastItem || lastItem.time !== curr.time) {
					acc.push(curr)
				} else {
					acc[acc.length - 1] = curr
				}
				return acc
			}, [])

		temperatureDiv = (
			<div style="padding-bottom: 20px;">
				<ChartHeading
					title={t('Hive internal temperature') + ' 🌡️'}
					value={`${lastTemperature} °C`}
					info={t('High or low temperature makes bees inefficient')}
				/>

				<Chart options={chartOptions} containerProps={{ style: { width: '100%', height: '200px' } }}>
					<AreaSeries
						data={sortedTemperatureData}
						options={{
							topColor: temperatureColor,
							bottomColor: `${temperatureColor}40`,
							lineColor: 'black',
							lineWidth: 2,
						}}
					>
						<PriceLine options={{ price: 13, color: 'blue', lineStyle: 2, lineWidth: 1 }} />
						<PriceLine options={{ price: 38, color: 'red', lineStyle: 2, lineWidth: 1 }} />
					</AreaSeries>
				</Chart>
			</div>
		)
	}

	return (
		<>
			{weightDiv}

			{temperatureDiv}
		</>
	)
}

const ValueOnlyBarTooltip = (params) => {
	let { active, payload, unit } = params
	if (active && payload && payload.length) {
		return (
			<div style="background:white;border-radius:5px;padding:0 10px;">
				{payload[0].value} {unit}
			</div>
		)
	}

	return null
}
