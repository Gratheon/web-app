import { AreaSeries, PriceLine } from 'lightweight-charts-react-components'
import { useMemo } from 'react'

import T, { useTranslation as t } from '@/shared/translate'
import ChartContainer from '@/shared/charts/ChartContainer'
import { formatMetricData } from '@/shared/charts/formatters'
import InfoIcon from '@/shared/infoIcon'

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
			label: new Date(item.time * 1000).toLocaleString(),
			value: `${item.value} °C`
		}))

		return { sortedTemperatureData, lastTemperature, temperatureColor, tableData }
	}, [temperatureData])

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
				<PriceLine price={13} options={{ color: 'blue', lineStyle: 2, lineWidth: 1 }} />
				<PriceLine price={38} options={{ color: 'red', lineStyle: 2, lineWidth: 1 }} />
			</AreaSeries>
		</ChartContainer>
	)
}
