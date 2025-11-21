import { Chart, LineSeries } from 'lightweight-charts-react-components'
import { useRef, useEffect } from 'react'

import ChartHeading from '@/shared/chartHeading'
import T, { useTranslation as t } from '@/shared/translate'
import ErrorMsg from '@/shared/messageError'

interface EntranceMovementChartProps {
	movementData: {
		code?: string
		message?: string
		metrics?: Array<{
			time: string
			beesIn: number | null
			beesOut: number | null
			netFlow: number | null
		}>
	}
	chartRefs: React.MutableRefObject<any[]>
	syncCharts: (sourceChart: any) => void
}

export default function EntranceMovementChart({ movementData, chartRefs, syncCharts }: EntranceMovementChartProps) {
	const chartApiRef = useRef(null)

	useEffect(() => {
		if (chartApiRef.current) {
			chartRefs.current.push(chartApiRef.current)

			const handleVisibleTimeRangeChange = () => {
				if (chartApiRef.current) {
					syncCharts(chartApiRef.current)
				}
			}

			chartApiRef.current.timeScale().subscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange)

			return () => {
				const currentChart = chartApiRef.current
				chartRefs.current = chartRefs.current.filter(c => c !== currentChart)
				if (currentChart) {
					try {
						currentChart.timeScale().unsubscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange)
					} catch (e) {
						console.error('Failed to unsubscribe:', e)
					}
				}
			}
		}
	}, [chartApiRef.current])

	const handleChartInit = (chart: any) => {
		chartApiRef.current = chart
	}

	if (!movementData || movementData.code) {
		if (movementData?.code) {
			return <ErrorMsg error={movementData} />
		}
		return (
			<p style="color:#bbb">
				<T>Bee entrance movement was not reported this week.</T>
			</p>
		)
	}

	if (movementData.metrics?.length === 0) {
		return (
			<p style="color:#bbb">
				<T>Bee entrance movement was not reported this week.</T>
			</p>
		)
	}

	const aggregatedData = new Map()

	movementData.metrics.forEach((row) => {
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

	const formattedBeesInData = Array.from(aggregatedData.entries())
		.map(([timestamp, data]) => ({
			time: timestamp,
			value: Math.round(data.beesIn * 100) / 100,
		}))
		.filter(item => item.value > 0)
		.sort((a, b) => a.time - b.time)

	const formattedBeesOutData = Array.from(aggregatedData.entries())
		.map(([timestamp, data]) => ({
			time: timestamp,
			value: Math.round(data.beesOut * 100) / 100,
		}))
		.filter(item => item.value > 0)
		.sort((a, b) => a.time - b.time)

	if (formattedBeesInData.length === 0 && formattedBeesOutData.length === 0) {
		return (
			<p style="color:#bbb">
				<T>Bee entrance movement was not reported this week.</T>
			</p>
		)
	}

	const lastMetric = movementData.metrics[movementData.metrics.length - 1]
	const lastBeesIn = lastMetric.beesIn != null ? Math.round(lastMetric.beesIn * 100) / 100 : 0
	const lastBeesOut = lastMetric.beesOut != null ? Math.round(lastMetric.beesOut * 100) / 100 : 0
	const netFlow = lastMetric.netFlow != null ? Math.round(lastMetric.netFlow * 100) / 100 : lastBeesIn - lastBeesOut

	const chartOptions = {
		layout: {
			attributionLogo: false,
		},
		timeScale: {
			timeVisible: true,
			secondsVisible: false,
			fixLeftEdge: true,
			fixRightEdge: true,
		},
	}

	return (
		<div style="padding-bottom: 20px;">
			<ChartHeading
				title={t('Bee Entrance Activity') + ' 🐝'}
				value={`In: ${lastBeesIn} | Out: ${lastBeesOut} | Net: ${netFlow > 0 ? '+' : ''}${netFlow}`}
				info={t('Track bee entrance and exit activity over time')}
			/>

			<Chart onInit={handleChartInit} options={chartOptions} containerProps={{ style: { width: '100%', height: '200px' } }}>
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
