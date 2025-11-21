import { Chart, HistogramSeries } from 'lightweight-charts-react-components'
import { useMemo, useRef, useEffect } from 'react'

import ChartHeading from '@/shared/chartHeading'
import T, { useTranslation as t } from '@/shared/translate'
import ErrorMsg from '@/shared/messageError'

const red = 'rgba(255,211,174,0.42)'
const green = 'rgba(126,207,36,0.83)'

interface WeightChartProps {
	weightData: {
		code?: string
		message?: string
		metrics?: Array<{ t: string; v: number }>
	}
	chartRefs: React.MutableRefObject<any[]>
	syncCharts: (sourceChart: any) => void
}

export default function WeightChart({ weightData, chartRefs, syncCharts }: WeightChartProps) {
	const chartApiRef = useRef(null)
	const kgLabel = t('kg', 'Shortest label for the unit of weight in kilograms')

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

	if (!weightData || weightData.code) {
		if (weightData?.code) {
			return <ErrorMsg error={weightData} />
		}
		return (
			<p style="color:#bbb">
				<T>Hive weight was not reported this week.</T>
			</p>
		)
	}

	if (weightData.metrics?.length === 0) {
		return (
			<p style="color:#bbb">
				<T>Hive weight was not reported this week.</T>
			</p>
		)
	}

	const formattedWeightData = weightData.metrics.map((row) => {
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

	const lastWeight = Math.round(100 * weightData.metrics[weightData.metrics.length - 1].v) / 100

	return (
		<div style="padding-bottom: 20px;">
			<ChartHeading
				title={t('Hive Weight') + ' ⚖️️'}
				value={`${lastWeight} ${kgLabel}`}
				info={t('Drop in hive weight may correlate with swarming or starvation')}
			/>

			<Chart onInit={handleChartInit} options={chartOptions} containerProps={{ style: { width: '100%', height: '200px' } }}>
				<HistogramSeries data={histogramData} />
			</Chart>
		</div>
	)
}
