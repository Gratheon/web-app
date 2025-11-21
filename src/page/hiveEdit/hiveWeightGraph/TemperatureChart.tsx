import { Chart, AreaSeries, PriceLine } from 'lightweight-charts-react-components'
import { useMemo, useRef, useEffect } from 'react'

import ChartHeading from '@/shared/chartHeading'
import T, { useTranslation as t } from '@/shared/translate'

const red = 'rgba(255,211,174,0.42)'
const green = 'rgba(126,207,36,0.83)'
const blue = '#8fddff'

interface TemperatureChartProps {
	temperatureData: {
		code?: string
		message?: string
		metrics?: Array<{ t: string; v: number }>
	}
	chartRefs: React.MutableRefObject<any[]>
	syncCharts: (sourceChart: any) => void
}

export default function TemperatureChart({ temperatureData, chartRefs, syncCharts }: TemperatureChartProps) {
	const chartApiRef = useRef(null)

	useEffect(() => {
		if (chartApiRef.current) {
			chartRefs.current.push(chartApiRef.current)

			const handleVisibleTimeRangeChange = () => {
				syncCharts(chartApiRef.current)
			}

			chartApiRef.current.timeScale().subscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange)

			return () => {
				chartRefs.current = chartRefs.current.filter(c => c !== chartApiRef.current)
				if (chartApiRef.current) {
					chartApiRef.current.timeScale().unsubscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange)
				}
			}
		}
	}, [chartRefs, syncCharts])

	const handleChartInit = (chart: any) => {
		chartApiRef.current = chart
	}

	const chartOptions = useMemo(() => ({
		layout: {
			attributionLogo: false,
		},
		timeScale: {
			timeVisible: true,
			secondsVisible: true,
		},
	}), [])

	if (!temperatureData || temperatureData.code || temperatureData.metrics?.length === 0) {
		return (
			<p style="color:#bbb">
				<T>Hive temperature was not reported this week.</T>
			</p>
		)
	}

	const lastTemperature = Math.round(
		100 * temperatureData.metrics[temperatureData.metrics.length - 1].v
	) / 100

	let temperatureColor = green

	if (lastTemperature < 13) {
		temperatureColor = blue
	} else if (lastTemperature > 38) {
		temperatureColor = red
	}

	const formattedTemperatureData = temperatureData.metrics.map((row) => {
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

	return (
		<div style="padding-bottom: 20px;">
			<ChartHeading
				title={t('Hive internal temperature') + ' 🌡️'}
				value={`${lastTemperature} °C`}
				info={t('High or low temperature makes bees inefficient')}
			/>

			<Chart onInit={handleChartInit} options={chartOptions} containerProps={{ style: { width: '100%', height: '200px' } }}>
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
