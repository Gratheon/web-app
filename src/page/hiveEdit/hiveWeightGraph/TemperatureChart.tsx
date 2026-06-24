import { AreaSeries, PriceLine } from 'lightweight-charts-react-components'
import { useMemo } from 'react'

import T, { useTranslation as t } from '@/shared/translate'
import ChartContainer from '@/shared/charts/ChartContainer'
import { formatMetricData } from '@/shared/charts/formatters'
import InfoIcon from '@/shared/infoIcon'
import { formatDateTimeByLocale } from '@/shared/dateLocale'
import { convertFromCelsius, convertMetricSeriesFromCelsius, formatTemperatureFromCelsius, type TemperatureUnit } from '@/shared/temperatureUnit'

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
	temperatureUnit?: TemperatureUnit
}

export default function TemperatureChart({ temperatureData, chartRefs, syncCharts, temperatureUnit = 'celsius' }: TemperatureChartProps) {
		const { sortedTemperatureData, lastTemperatureCelsius, temperatureColor, tableData } = useMemo(() => {
			if (!temperatureData || temperatureData.code || !temperatureData.metrics || temperatureData.metrics.length === 0) {
				return { sortedTemperatureData: [], lastTemperatureCelsius: 0, temperatureColor: green, tableData: [] }
			}

		const sortedTemperatureData = convertMetricSeriesFromCelsius(formatMetricData(temperatureData.metrics), temperatureUnit)
			const lastTemperatureCelsius = temperatureData.metrics[temperatureData.metrics.length - 1].v

			let temperatureColor = green
		if (lastTemperatureCelsius < 13) {
			temperatureColor = blue
		} else if (lastTemperatureCelsius > 38) {
			temperatureColor = red
		}

		const tableData = sortedTemperatureData.map(item => ({
			label: formatDateTimeByLocale(new Date(item.time * 1000), { dateStyle: 'medium', timeStyle: 'short' }),
			value: `${Math.round(item.value * 10) / 10}${temperatureUnit === 'fahrenheit' ? '°F' : '°C'}`
		}))

			return { sortedTemperatureData, lastTemperatureCelsius, temperatureColor, tableData }
	}, [temperatureData, temperatureUnit])

	if (!temperatureData || temperatureData.code || sortedTemperatureData.length === 0) {
		return (
			<div style={{
				padding: '16px',
				background: '#f9f9f9',
				borderRadius: '8px',
				border: '1px solid #e0e0e0'
			}}>
				<p style={{ margin: 0, color: '#666', display: 'flex', alignItems: 'center' }}>
					<span style={{ marginRight: '8px' }}>🌡️</span>
					<strong><T>Hive temperature was not reported this week.</T></strong>
					<InfoIcon>
						<p style={{ margin: '0 0 8px 0' }}>
							<strong><T>To start tracking hive temperature:</T></strong>
						</p>
						<ol style={{ margin: '0 0 12px 16px', paddingLeft: 0 }}>
							<li><T>Set up IoT temperature sensors inside your hive</T></li>
							<li><T>Send data via our REST API</T></li>
							<li><T>View the documentation at</T> <a href="https://gratheon.com/docs/API/REST" target="_blank" rel="noopener noreferrer">gratheon.com/docs/API/REST</a></li>
						</ol>
						<p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
							💡 <em><T>Tip: Temperature monitoring helps ensure optimal brood development (ideal range: 33-36°C) and detect ventilation issues.</T></em>
						</p>
					</InfoIcon>
				</p>
			</div>
		)
	}

	return (
		<ChartContainer
			title={t('Hive internal temperature') + ' 🌡️'}
			value={formatTemperatureFromCelsius(lastTemperatureCelsius, temperatureUnit)}
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
				<PriceLine price={convertFromCelsius(13, temperatureUnit) ?? 13} options={{ color: 'blue', lineStyle: 2, lineWidth: 1 }} />
				<PriceLine price={convertFromCelsius(38, temperatureUnit) ?? 38} options={{ color: 'red', lineStyle: 2, lineWidth: 1 }} />
			</AreaSeries>
		</ChartContainer>
	)
}
