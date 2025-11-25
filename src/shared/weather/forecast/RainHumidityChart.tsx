import { LineSeries } from 'lightweight-charts-react-components'
import { useTranslation as t } from '@/shared/translate'
import ChartContainer from '@/shared/charts/ChartContainer'

type RainHumidityChartProps = {
	humidityData: any[]
	rainData: any[]
	medianRain: number
	chartRefs?: React.MutableRefObject<any[]>
	syncCharts?: (sourceChart: any) => void
}

function calculateMedian(values: number[]): number {
	if (values.length === 0) return 0
	const sortedValues = [...values].sort((a, b) => a - b)
	const mid = Math.floor(sortedValues.length / 2)

	return sortedValues.length % 2 !== 0
		? sortedValues[mid]
		: (sortedValues[mid - 1] + sortedValues[mid]) / 2
}

export default function RainHumidityChart({ humidityData, rainData, medianRain, chartRefs, syncCharts }: RainHumidityChartProps) {
	return (
		<ChartContainer
			title={t('Rain probability') + ' 🌧️'}
			value={`${medianRain} %`}
			info={t('Bees are not flying in the rain')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			chartOptions={{ height: 300 }}
		>
			<LineSeries
				data={humidityData}
				options={{
					color: '#8884d8',
					lineWidth: 2,
				}}
			/>
			<LineSeries
				data={rainData}
				options={{
					color: '#82ca9d',
					lineWidth: 2,
					priceScaleId: 'right',
				}}
			/>
		</ChartContainer>
	)
}

export { calculateMedian }

