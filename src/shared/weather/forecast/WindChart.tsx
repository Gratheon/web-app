import { AreaSeries, PriceLine } from 'lightweight-charts-react-components'
import { useTranslation as t } from '@/shared/translate'
import ChartContainer from '@/shared/charts/ChartContainer'

type WindChartProps = {
	data: any[]
	currentWindSpeed: number
	chartRefs?: React.MutableRefObject<any[]>
	syncCharts?: (sourceChart: any) => void
}

export default function WindChart({ data, currentWindSpeed, chartRefs, syncCharts }: WindChartProps) {
	return (
		<ChartContainer
			emoji="💨"
			title={t('Wind speed')}
			value={`${currentWindSpeed} km/h`}
			info={t('High wind speed can collapse hives')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			chartOptions={{ height: 300 }}
		>
			<AreaSeries
				data={data}
				options={{
					topColor: 'green',
					bottomColor: 'rgba(0,128,0,0.4)',
					lineColor: 'black',
					lineWidth: 2,
				}}
			>
				<PriceLine price={50} options={{ color: 'red', lineStyle: 2, lineWidth: 1 }} />
			</AreaSeries>
		</ChartContainer>
	)
}

