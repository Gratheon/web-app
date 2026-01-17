import { HistogramSeries } from 'lightweight-charts-react-components'
import { useMemo } from 'react'

import T, { useTranslation as t } from '@/shared/translate'
import ErrorMsg from '@/shared/messageError'
import ChartContainer from '@/shared/charts/ChartContainer'
import { formatMetricData, formatTableData } from '@/shared/charts/formatters'
import InfoIcon from '@/shared/infoIcon'

const red = 'rgba(255,211,174,0.42)'
const green = 'rgba(126,207,36,0.83)'

interface WeightChartProps {
	weightData: {
		code?: string
		message?: string
		metrics?: Array<{ t: string; v: number }>
	}
	chartRefs: React.MutableRefObject<any[]>
	syncCharts: (sourceChart: any) => void
}

export default function WeightChart({ weightData, chartRefs, syncCharts }: WeightChartProps) {
	const kgLabel = t('kg', 'Shortest label for the unit of weight in kilograms')

	const { histogramData, lastWeight, tableData } = useMemo(() => {
		if (!weightData || weightData.code || !weightData.metrics || weightData.metrics.length === 0) {
			return { histogramData: [], lastWeight: 0, tableData: [] }
		}

		const sortedWeightData = formatMetricData(weightData.metrics)

		const histogramData = sortedWeightData.map((entry, index) => {
			const previousValue = index > 0 ? sortedWeightData[index - 1].value : entry.value
			const color = entry.value < previousValue ? red : green
			return {
				time: entry.time,
				value: entry.value,
				color: color
			}
		})

		const lastWeight = Math.round(100 * weightData.metrics[weightData.metrics.length - 1].v) / 100

		const tableData = sortedWeightData.map(item => ({
			label: new Date(item.time * 1000).toLocaleString(),
			value: `${item.value} ${kgLabel}`
		}))

		return { histogramData, lastWeight, tableData }
	}, [weightData, kgLabel])

	if (!weightData || weightData.code) {
		if (weightData?.code) {
			return <ErrorMsg error={weightData} />
		}
		return (
			<div style={{
				padding: '16px',
				background: '#f9f9f9',
				borderRadius: '8px',
				border: '1px solid #e0e0e0'
			}}>
				<p style={{ margin: 0, color: '#666', display: 'flex', alignItems: 'center' }}>
					<span style={{ marginRight: '8px' }}>⚖️</span>
					<strong><T>Hive weight was not reported this week.</T></strong>
					<InfoIcon>
						<p style={{ margin: '0 0 8px 0' }}>
							<strong><T>To start tracking hive weight:</T></strong>
						</p>
						<ol style={{ margin: '0 0 12px 16px', paddingLeft: 0 }}>
							<li><T>Set up IoT sensors to automatically report weight data</T></li>
							<li><T>Send data via our REST API</T></li>
							<li><T>View the documentation at</T> <a href="https://gratheon.com/docs/API/REST" target="_blank" rel="noopener noreferrer">gratheon.com/docs/API/REST</a></li>
						</ol>
						<p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
							💡 <em><T>Tip: Regular weight monitoring helps detect swarming, starvation, and honey flow patterns.</T></em>
						</p>
					</InfoIcon>
				</p>
			</div>
		)
	}

	if (histogramData.length === 0) {
		return (
			<div style={{
				padding: '16px',
				background: '#f9f9f9',
				borderRadius: '8px',
				border: '1px solid #e0e0e0'
			}}>
				<p style={{ margin: 0, color: '#666', display: 'flex', alignItems: 'center' }}>
					<span style={{ marginRight: '8px' }}>⚖️</span>
					<strong><T>Hive weight was not reported this week.</T></strong>
					<InfoIcon>
						<p style={{ margin: '0 0 8px 0' }}>
							<strong><T>To start tracking hive weight:</T></strong>
						</p>
						<ol style={{ margin: '0 0 12px 16px', paddingLeft: 0 }}>
							<li><T>Set up IoT sensors to automatically report weight data</T></li>
							<li><T>Send data via our REST API</T></li>
							<li><T>View the documentation at</T> <a href="https://gratheon.com/docs/API/REST" target="_blank" rel="noopener noreferrer">gratheon.com/docs/API/REST</a></li>
						</ol>
						<p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
							💡 <em><T>Tip: Regular weight monitoring helps detect swarming, starvation, and honey flow patterns.</T></em>
						</p>
					</InfoIcon>
				</p>
			</div>
		)
	}

	return (
		<ChartContainer
			title={t('Hive Weight') + ' ⚖️️'}
			value={`${lastWeight} ${kgLabel}`}
			info={t('Drop in hive weight may correlate with swarming or starvation')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			showTable={true}
			tableData={tableData}
		>
			<HistogramSeries data={histogramData} />
		</ChartContainer>
	)
}
