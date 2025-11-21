import { Chart, AreaSeries, HistogramSeries, PriceLine, LineSeries } from 'lightweight-charts-react-components'
import { useMemo } from 'react'

import { gql, useQuery } from '@/api'

import ChartHeading from '@/shared/chartHeading'
import Loader from '@/shared/loader'
import { formatTime } from '@/shared/dateTimeFormat'
import T, { useTranslation as t } from '@/shared/translate'
import { useLiveQuery } from 'dexie-react-hooks'
import { getUser } from '@/models/user'
import ErrorMsg from '@/shared/messageError'

const WEIGHT_QUERY = gql`
	query hiveWeight($hiveId: ID!, $timeRangeMin: Int, $timeFrom: DateTime!, $timeTo: DateTime!) {
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
		entranceMovement(hiveId: $hiveId, timeFrom: $timeFrom, timeTo: $timeTo) {
			... on EntranceMovementList {
				metrics {
					time
					beesIn
					beesOut
					netFlow
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
const orange = 'rgba(255,165,0,0.6)'
const purple = 'rgba(147,112,219,0.6)'

export default function HiveWeightGraph({ hiveId }) {
	let userStored = useLiveQuery(() => getUser(), [], null)

	const { now, weekAgo } = useMemo(() => {
		const now = new Date()
		const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
		return { now, weekAgo }
	}, [])

	let {
		loading,
		error: errorGet,
		data,
		errorNetwork,
	} = useQuery(WEIGHT_QUERY, {
		variables: {
			hiveId,
			timeRangeMin: 7 * 60 * 24,
			timeFrom: weekAgo.toISOString(),
			timeTo: now.toISOString(),
		},
	})

	if (loading || !userStored) {
		return <Loader />
	}

	if (errorGet || errorNetwork || !data) {
		return <ErrorMsg error={{ message: 'Failed to load metrics data', code: 'NETWORK_ERROR' }} />
	}

	let weightDiv = null
	let temperatureDiv = null
	let movementDiv = null
	let kgLabel = t('kg', 'Shortest label for the unit of weight in kilograms')

	const chartOptions = useMemo(() => ({
		layout: {
			attributionLogo: false,
		},
		timeScale: {
			timeVisible: true,
			secondsVisible: true,
		},
	}), [])

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

	if (!data.temperatureCelsius || data.temperatureCelsius.code || data.temperatureCelsius.metrics?.length === 0) {
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

	if (!data.entranceMovement || data.entranceMovement.code) {
		if (data.entranceMovement?.code) {
			movementDiv = <ErrorMsg error={data.entranceMovement} />
		} else {
			movementDiv = (
				<p style="color:#bbb">
					<T>Bee entrance movement was not reported this week.</T>
				</p>
			)
		}
	} else if (data.entranceMovement.metrics.length == 0) {
		movementDiv = (
			<p style="color:#bbb">
				<T>Bee entrance movement was not reported this week.</T>
			</p>
		)
	} else {
		console.log('Processing entrance movement data:', data.entranceMovement.metrics)

		const aggregatedData = new Map()

		data.entranceMovement.metrics.forEach((row) => {
			const date = new Date(row.time)
			const timestamp = Math.floor(date.getTime() / 1000)

			if (!aggregatedData.has(timestamp)) {
				aggregatedData.set(timestamp, {
					beesIn: 0,
					beesOut: 0,
					count: 0
				})
			}

			const entry = aggregatedData.get(timestamp)
			if (row.beesIn != null) {
				entry.beesIn += row.beesIn
				entry.count++
			}
			if (row.beesOut != null) {
				entry.beesOut += row.beesOut
			}
		})

		let formattedBeesInData = Array.from(aggregatedData.entries())
			.map(([timestamp, data]) => ({
				time: timestamp,
				value: Math.round(data.beesIn * 100) / 100,
			}))
			.filter(item => item.value > 0)
			.sort((a, b) => a.time - b.time)

		let formattedBeesOutData = Array.from(aggregatedData.entries())
			.map(([timestamp, data]) => ({
				time: timestamp,
				value: Math.round(data.beesOut * 100) / 100,
			}))
			.filter(item => item.value > 0)
			.sort((a, b) => a.time - b.time)

		console.log('Formatted beesIn data:', formattedBeesInData)
		console.log('Formatted beesOut data:', formattedBeesOutData)

		console.log('First beesIn timestamp as date:', new Date(formattedBeesInData[0].time * 1000))
		console.log('Last beesIn timestamp as date:', new Date(formattedBeesInData[formattedBeesInData.length - 1].time * 1000))
		console.log('Current weekAgo:', weekAgo)
		console.log('Current now:', now)

		if (formattedBeesInData.length === 0 && formattedBeesOutData.length === 0) {
			movementDiv = (
				<p style="color:#bbb">
					<T>Bee entrance movement was not reported this week.</T>
				</p>
			)
		} else {
			const lastMetric = data.entranceMovement.metrics[data.entranceMovement.metrics.length - 1]
			const lastBeesIn = lastMetric.beesIn != null ? Math.round(lastMetric.beesIn * 100) / 100 : 0
			const lastBeesOut = lastMetric.beesOut != null ? Math.round(lastMetric.beesOut * 100) / 100 : 0
			const netFlow = lastMetric.netFlow != null ? Math.round(lastMetric.netFlow * 100) / 100 : lastBeesIn - lastBeesOut

			console.log('Rendering chart with data lengths:', {
				beesIn: formattedBeesInData.length,
				beesOut: formattedBeesOutData.length
			})
			console.log('Sample beesIn data points:', formattedBeesInData.slice(0, 3))
			console.log('Sample beesOut data points:', formattedBeesOutData.slice(0, 3))

			const movementChartOptions = {
				layout: {
					attributionLogo: false,
				},
				timeScale: {
					timeVisible: true,
					secondsVisible: true,
				},
			}

			movementDiv = (
				<div style="padding-bottom: 20px;">
					<ChartHeading
						title={t('Bee Entrance Activity') + ' 🐝'}
						value={`In: ${lastBeesIn} | Out: ${lastBeesOut} | Net: ${netFlow > 0 ? '+' : ''}${netFlow}`}
						info={t('Track bee entrance and exit activity over time')}
					/>

					<Chart options={movementChartOptions} containerProps={{ style: { width: '100%', height: '200px' } }}>
						<LineSeries
							data={formattedBeesInData}
							options={{
								color: 'green',
								lineWidth: 2,
							}}
						/>
						<LineSeries
							data={formattedBeesOutData}
							options={{
								color: 'orange',
								lineWidth: 2,
							}}
						/>
					</Chart>
				</div>
			)
		}
	}

	return (
		<>
			{weightDiv}

			{temperatureDiv}

			{movementDiv}
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
