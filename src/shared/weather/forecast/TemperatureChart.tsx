import { AreaSeries, PriceLine } from 'lightweight-charts-react-components'
import { useTranslation as t } from '@/shared/translate'
import ChartContainer from '@/shared/charts/ChartContainer'

type TemperatureChartProps = {
	data: any[]
	currentTemperature: number
	chartRefs?: React.MutableRefObject<any[]>
	syncCharts?: (sourceChart: any) => void
}

export default function TemperatureChart({ data, currentTemperature, chartRefs, syncCharts }: TemperatureChartProps) {
	const averageTemperature = data.reduce((acc, curr) => acc + curr.value, 0) / data.length

	let temperatureTopColor = '#0000FF'
	let temperatureBottomColor = 'rgba(0, 0, 255, 0.25)'

	if (averageTemperature >= 13 && averageTemperature <= 27) {
		temperatureTopColor = '#00FF00'
		temperatureBottomColor = 'rgba(0, 255, 0, 0.25)'
	} else if (averageTemperature > 27) {
		temperatureTopColor = '#FF0000'
		temperatureBottomColor = 'rgba(255, 0, 0, 0.25)'
	}

	return (
		<ChartContainer
			emoji="🌡️"
			title={t('Temperature')}
			value={`${currentTemperature} °C`}
			info={t('Too high or low temperature is bad for bees')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			chartOptions={{ height: 300 }}
		>
			<AreaSeries
				data={data}
				options={{
					topColor: temperatureTopColor,
					bottomColor: temperatureBottomColor,
					lineColor: 'black',
					lineWidth: 2,
				}}
			>
				<PriceLine price={13} options={{ color: 'blue', lineStyle: 2, lineWidth: 1 }} />
				<PriceLine price={28} options={{ color: 'red', lineStyle: 2, lineWidth: 1 }} />
			</AreaSeries>
		</ChartContainer>
	)
}

