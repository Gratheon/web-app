import { AreaSeries } from 'lightweight-charts-react-components'
import ChartContainer from '@/shared/charts/ChartContainer'
import { useTranslation as t } from '@/shared/translate'

type RainChartProps = {
	rainData: {
		rain: Array<{ time: string; value: number | null }>
	}
	chartRefs?: React.MutableRefObject<any[]>
	syncCharts?: (sourceChart: any) => void
}

export default function RainChart({ rainData, chartRefs, syncCharts }: RainChartProps) {
	const formattedData = rainData.rain
		.filter(d => d.value !== null)
		.map(d => ({
			time: new Date(d.time).getTime() / 1000 as any,
			value: d.value
		}))

	const totalRain = formattedData.reduce((acc, curr) => acc + curr.value, 0)

	return (
		<ChartContainer
			emoji="🌧️"
			title={t('Rainfall')}
			value={`${totalRain.toFixed(1)} mm ${t('total')}`}
			info={t('Rain prevents bees from foraging. Extended rainy periods can impact colony nutrition.')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			chartOptions={{ height: 300 }}
		>
			<AreaSeries
				data={formattedData}
				options={{
					topColor: 'rgba(33, 150, 243, 0.56)',
					bottomColor: 'rgba(33, 150, 243, 0.04)',
					lineColor: '#2196F3',
					lineWidth: 2,
				}}
			/>
		</ChartContainer>
	)
}

