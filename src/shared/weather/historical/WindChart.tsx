import { LineSeries } from 'lightweight-charts-react-components'
import ChartContainer from '@/shared/charts/ChartContainer'
import { useTranslation as t } from '@/shared/translate'

type WindChartProps = {
	windData: {
		wind_speed_10m: Array<{ time: string; value: number | null }>
		wind_gusts_10m: Array<{ time: string; value: number | null }>
	}
	chartRefs?: React.MutableRefObject<any[]>
	syncCharts?: (sourceChart: any) => void
}

export default function WindChart({ windData, chartRefs, syncCharts }: WindChartProps) {
	const windSpeedData = windData.wind_speed_10m
		.filter(d => d.value !== null)
		.map(d => ({
			time: new Date(d.time).getTime() / 1000 as any,
			value: d.value
		}))

	const windGustsData = windData.wind_gusts_10m
		.filter(d => d.value !== null)
		.map(d => ({
			time: new Date(d.time).getTime() / 1000 as any,
			value: d.value
		}))

	const avgWindSpeed = windSpeedData.length > 0
		? windSpeedData.reduce((acc, curr) => acc + curr.value, 0) / windSpeedData.length
		: 0

	return (
		<ChartContainer
			emoji="💨"
			title={t('Wind Speed')}
			value={`${avgWindSpeed.toFixed(1)} m/s ${t('avg')}`}
			info={t('Wind affects bee foraging activity. Strong winds (>10 m/s) can prevent bees from flying.')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			chartOptions={{ height: 300 }}
		>
			<LineSeries
				data={windSpeedData}
				options={{
					color: '#2962FF',
					lineWidth: 2,
					title: t('Wind Speed (10m)')
				}}
			/>
			<LineSeries
				data={windGustsData}
				options={{
					color: '#FF6D00',
					lineWidth: 1,
					lineStyle: 2,
					title: t('Wind Gusts (10m)')
				}}
			/>
		</ChartContainer>
	)
}

