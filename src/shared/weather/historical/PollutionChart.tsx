import { LineSeries } from 'lightweight-charts-react-components'
import ChartContainer from '@/shared/charts/ChartContainer'

type PollutionChartProps = {
	pollutionData: {
		pm2_5: Array<{ time: string; value: number | null }>
		pm10: Array<{ time: string; value: number | null }>
	}
	chartRefs?: React.MutableRefObject<any[]>
	syncCharts?: (sourceChart: any) => void
}

export default function PollutionChart({ pollutionData, chartRefs, syncCharts }: PollutionChartProps) {
	const pm25Data = pollutionData.pm2_5
		.filter(d => d.value !== null)
		.map(d => ({
			time: new Date(d.time).getTime() / 1000,
			value: d.value
		}))

	const pm10Data = pollutionData.pm10
		.filter(d => d.value !== null)
		.map(d => ({
			time: new Date(d.time).getTime() / 1000,
			value: d.value
		}))

	const avgPM25 = pm25Data.length > 0
		? pm25Data.reduce((acc, curr) => acc + curr.value, 0) / pm25Data.length
		: 0

	const hasData = pm25Data.length > 0 || pm10Data.length > 0

	if (!hasData) {
		return null
	}

	return (
		<ChartContainer
			emoji="🏭"
			title="Air Quality"
			value={`${avgPM25.toFixed(1)} μg/m³ PM2.5 avg`}
			info="Air pollution can affect bee health and navigation. High PM levels may impact foraging."
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			chartOptions={{ height: 300 }}
		>
			{pm25Data.length > 0 && (
				<LineSeries
					data={pm25Data}
					options={{
						color: '#F44336',
						lineWidth: 2,
						title: 'PM2.5'
					}}
				/>
			)}
			{pm10Data.length > 0 && (
				<LineSeries
					data={pm10Data}
					options={{
						color: '#FF9800',
						lineWidth: 2,
						title: 'PM10'
					}}
				/>
			)}
		</ChartContainer>
	)
}

