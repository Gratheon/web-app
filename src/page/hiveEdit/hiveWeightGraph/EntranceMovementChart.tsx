import { LineSeries } from 'lightweight-charts-react-components'
import { useMemo } from 'react'

import T, { useTranslation as t } from '@/shared/translate'
import ErrorMsg from '@/shared/messageError'
import ChartContainer from '@/shared/charts/ChartContainer'
import { formatEntranceMovementData } from '@/shared/charts/formatters'
import InfoIcon from '@/shared/infoIcon'

interface EntranceMovementChartProps {
	movementData: {
		code?: string
		message?: string
		metrics?: Array<{
			time: string
			beesIn: number | null
			beesOut: number | null
			netFlow: number | null
		}>
	}
	chartRefs: React.MutableRefObject<any[]>
	syncCharts: (sourceChart: any) => void
}

export default function EntranceMovementChart({ movementData, chartRefs, syncCharts }: EntranceMovementChartProps) {
	const { beesInData, beesOutData, lastMetric, tableData } = useMemo(() => {
		if (!movementData || movementData.code || !movementData.metrics || movementData.metrics.length === 0) {
			return { beesInData: [], beesOutData: [], lastMetric: null, tableData: [] }
		}

		const { beesInData, beesOutData } = formatEntranceMovementData(movementData.metrics)
		const lastMetric = movementData.metrics[movementData.metrics.length - 1]

		const tableData = movementData.metrics.map(item => ({
			label: new Date(item.time).toLocaleString(),
			value: `In: ${item.beesIn?.toFixed(2) || '0'} | Out: ${item.beesOut?.toFixed(2) || '0'} | Net: ${item.netFlow?.toFixed(2) || '0'}`
		}))

		return { beesInData, beesOutData, lastMetric, tableData }
	}, [movementData])

	if (!movementData || movementData.code) {
		if (movementData?.code) {
			return <ErrorMsg error={movementData} />
		}
		return (
			<div style={{
				padding: '16px',
				background: '#f9f9f9',
				borderRadius: '8px',
				border: '1px solid #e0e0e0'
			}}>
				<p style={{ margin: 0, color: '#666', display: 'flex', alignItems: 'center' }}>
					<span style={{ marginRight: '8px' }}>🚪</span>
					<strong><T>Bee entrance movement was not reported this week.</T></strong>
					<InfoIcon>
						<p style={{ margin: '0 0 8px 0' }}>
							<strong><T>To start tracking bee entrance activity:</T></strong>
						</p>
						<ol style={{ margin: '0 0 12px 16px', paddingLeft: 0 }}>
							<li><T>Set up entrance monitoring sensors (camera or beam counter)</T></li>
							<li><T>Send data via our REST API</T></li>
							<li><T>View the documentation at</T> <a href="https://gratheon.com/docs/API/REST" target="_blank" rel="noopener noreferrer">gratheon.com/docs/API/REST</a></li>
						</ol>
						<p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
							💡 <em><T>Tip: Entrance activity patterns help identify foraging behavior, robbing, and colony strength changes.</T></em>
						</p>
					</InfoIcon>
				</p>
			</div>
		)
	}

	if (beesInData.length === 0 && beesOutData.length === 0) {
		return (
			<div style={{
				padding: '16px',
				background: '#f9f9f9',
				borderRadius: '8px',
				border: '1px solid #e0e0e0'
			}}>
				<p style={{ margin: 0, color: '#666', display: 'flex', alignItems: 'center' }}>
					<span style={{ marginRight: '8px' }}>🚪</span>
					<strong><T>Bee entrance movement was not reported this week.</T></strong>
					<InfoIcon>
						<p style={{ margin: '0 0 8px 0' }}>
							<strong><T>To start tracking bee entrance activity:</T></strong>
						</p>
						<ol style={{ margin: '0 0 12px 16px', paddingLeft: 0 }}>
							<li><T>Set up entrance monitoring sensors (camera or beam counter)</T></li>
							<li><T>Send data via our REST API</T></li>
							<li><T>View the documentation at</T> <a href="https://gratheon.com/docs/API/REST" target="_blank" rel="noopener noreferrer">gratheon.com/docs/API/REST</a></li>
						</ol>
						<p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
							💡 <em><T>Tip: Entrance activity patterns help identify foraging behavior, robbing, and colony strength changes.</T></em>
						</p>
					</InfoIcon>
				</p>
			</div>
		)
	}

	const lastBeesIn = lastMetric?.beesIn != null ? Math.round(lastMetric.beesIn * 100) / 100 : 0
	const lastBeesOut = lastMetric?.beesOut != null ? Math.round(lastMetric.beesOut * 100) / 100 : 0
	const netFlow = lastMetric?.netFlow != null ? Math.round(lastMetric.netFlow * 100) / 100 : lastBeesIn - lastBeesOut

	return (
		<ChartContainer
			title={t('Bee Entrance Activity') + ' 🐝'}
			value={`In: ${lastBeesIn} | Out: ${lastBeesOut} | Net: ${netFlow > 0 ? '+' : ''}${netFlow}`}
			info={t('Track bee entrance and exit activity over time')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			showTable={true}
			tableData={tableData}
		>
			<LineSeries
				data={beesInData}
				options={{
					color: 'green',
					lineWidth: 2,
				}}
			/>
			<LineSeries
				data={beesOutData}
				options={{
					color: 'orange',
					lineWidth: 2,
				}}
			/>
		</ChartContainer>
	)
}
