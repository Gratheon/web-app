import { LineSeries, PriceLine } from 'lightweight-charts-react-components'
import ChartContainer from '@/shared/charts/ChartContainer'
import { useTranslation as t } from '@/shared/translate'

type TemperatureChartProps = {
	temperatureData: {
		temperature_2m: Array<{ time: string; value: number | null }>
	}
	chartRefs?: React.MutableRefObject<any[]>
	syncCharts?: (sourceChart: any) => void
}

export default function TemperatureChart({ temperatureData, chartRefs, syncCharts }: TemperatureChartProps) {
	const tempData = temperatureData.temperature_2m
		.filter(d => d.value !== null)
		.map(d => ({
			time: new Date(d.time).getTime() / 1000 as any,
			value: d.value
		}))

	const avgTemp = tempData.length > 0
		? tempData.reduce((acc, curr) => acc + curr.value, 0) / tempData.length
		: 0

	const minTemp = tempData.length > 0
		? Math.min(...tempData.map(d => d.value))
		: 0

	const maxTemp = tempData.length > 0
		? Math.max(...tempData.map(d => d.value))
		: 0

	return (
		<ChartContainer
			emoji="🌡️"
			title={t('Temperature')}
			value={`${avgTemp.toFixed(1)}°C ${t('avg')}`}
			info={t('Temperature greatly affects bee activity. Bees fly between 10-35°C, with optimal foraging at 18-25°C. Below 10°C or above 38°C bees stay in the hive.')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			chartOptions={{ height: 300 }}
		>
			<LineSeries
				data={tempData}
				options={{
					color: '#FF6B35',
					lineWidth: 2,
					title: t('Temperature (2m)')
				}}
			>
				<PriceLine
					price={10}
					options={{
						color: 'rgba(33, 150, 243, 0.5)',
						lineWidth: 1,
						lineStyle: 2,
						axisLabelVisible: true,
						title: t('Min flight temp (10°C)')
					}}
				/>
				<PriceLine
					price={18}
					options={{
						color: 'rgba(76, 175, 80, 0.5)',
						lineWidth: 1,
						lineStyle: 2,
						axisLabelVisible: true,
						title: t('Optimal min (18°C)')
					}}
				/>
				<PriceLine
					price={25}
					options={{
						color: 'rgba(76, 175, 80, 0.5)',
						lineWidth: 1,
						lineStyle: 2,
						axisLabelVisible: true,
						title: t('Optimal max (25°C)')
					}}
				/>
				<PriceLine
					price={35}
					options={{
						color: 'rgba(255, 152, 0, 0.5)',
						lineWidth: 1,
						lineStyle: 2,
						axisLabelVisible: true,
						title: t('Max flight temp (35°C)')
					}}
				/>
			</LineSeries>
		</ChartContainer>
	)
}

