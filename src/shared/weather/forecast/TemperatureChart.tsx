import { AreaSeries, PriceLine } from 'lightweight-charts-react-components'
import { useTranslation as t } from '@/shared/translate'
import ChartContainer from '@/shared/charts/ChartContainer'
import { convertFromCelsius, convertMetricSeriesFromCelsius, formatTemperatureFromCelsius, type TemperatureUnit } from '@/shared/temperatureUnit'

type TemperatureChartProps = {
	data: any[]
	currentTemperature: number
	chartRefs?: React.MutableRefObject<any[]>
	syncCharts?: (sourceChart: any) => void
	temperatureUnit?: TemperatureUnit
}

export default function TemperatureChart({ data, currentTemperature, chartRefs, syncCharts, temperatureUnit = 'celsius' }: TemperatureChartProps) {
	const displayData = convertMetricSeriesFromCelsius(data, temperatureUnit)
	const averageTemperature = displayData.reduce((acc, curr) => acc + curr.value, 0) / displayData.length

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
			value={formatTemperatureFromCelsius(currentTemperature, temperatureUnit)}
			info={t('Too high or low temperature is bad for bees')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			chartOptions={{ height: 300 }}
		>
			<AreaSeries
				data={displayData}
				options={{
					topColor: temperatureTopColor,
					bottomColor: temperatureBottomColor,
					lineColor: 'black',
					lineWidth: 2,
				}}
			>
				<PriceLine price={convertFromCelsius(13, temperatureUnit) ?? 13} options={{ color: 'blue', lineStyle: 2, lineWidth: 1 }} />
				<PriceLine price={convertFromCelsius(28, temperatureUnit) ?? 28} options={{ color: 'red', lineStyle: 2, lineWidth: 1 }} />
			</AreaSeries>
		</ChartContainer>
	)
}

