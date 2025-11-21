import { AreaSeries, PriceLine } from 'lightweight-charts-react-components'
import { useMemo } from 'react'

import T, { useTranslation as t } from '@/shared/translate'
import ChartContainer from '@/shared/charts/ChartContainer'
import { formatMetricData } from '@/shared/charts/formatters'

const red = 'rgba(255,211,174,0.42)'
const green = 'rgba(126,207,36,0.83)'
const blue = '#8fddff'

interface TemperatureChartProps {
	temperatureData: {
		code?: string
		message?: string
		metrics?: Array<{ t: string; v: number }>
	}
	chartRefs: React.MutableRefObject<any[]>
	syncCharts: (sourceChart: any) => void
}

export default function TemperatureChart({ temperatureData, chartRefs, syncCharts }: TemperatureChartProps) {
	const { sortedTemperatureData, lastTemperature, temperatureColor, tableData } = useMemo(() => {
		if (!temperatureData || temperatureData.code || !temperatureData.metrics || temperatureData.metrics.length === 0) {
			return { sortedTemperatureData: [], lastTemperature: 0, temperatureColor: green, tableData: [] }
		}

		const sortedTemperatureData = formatMetricData(temperatureData.metrics)
		const lastTemperature = Math.round(100 * temperatureData.metrics[temperatureData.metrics.length - 1].v) / 100

		let temperatureColor = green
		if (lastTemperature < 13) {
			temperatureColor = blue
		} else if (lastTemperature > 38) {
			temperatureColor = red
		}

		const tableData = sortedTemperatureData.map(item => ({
			Time: new Date(item.time * 1000).toLocaleString(),
			'Temperature (°C)': item.value
		}))

		return { sortedTemperatureData, lastTemperature, temperatureColor, tableData }
	}, [temperatureData])

	if (!temperatureData || temperatureData.code || sortedTemperatureData.length === 0) {
		return (
			<p style="color:#bbb">
				<T>Hive temperature was not reported this week.</T>
			</p>
		)
	}

	return (
		<ChartContainer
			title={t('Hive internal temperature') + ' 🌡️'}
			value={`${lastTemperature} °C`}
			info={t('High or low temperature makes bees inefficient')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			showTable={true}
			tableData={tableData}
		>
			<AreaSeries
				data={sortedTemperatureData}
				options={{
					topColor: temperatureColor,
					bottomColor: `${temperatureColor}40`,
					lineColor: 'black',
					lineWidth: 2,
				}}
			>
				<PriceLine options={{ price: 13, color: 'blue', lineStyle: 2, lineWidth: 1 }} />
				<PriceLine options={{ price: 38, color: 'red', lineStyle: 2, lineWidth: 1 }} />
			</AreaSeries>
		</ChartContainer>
	)
}
