import { LineSeries } from 'lightweight-charts-react-components'
import { useMemo } from 'react'

import T, { useTranslation as t } from '@/shared/translate'
import ErrorMsg from '@/shared/messageError'
import ChartContainer from '@/shared/charts/ChartContainer'
import { formatEntranceMovementData } from '@/shared/charts/formatters'

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
			Time: new Date(item.time).toLocaleString(),
			'Bees In': item.beesIn?.toFixed(2) || '0',
			'Bees Out': item.beesOut?.toFixed(2) || '0',
			'Net Flow': item.netFlow?.toFixed(2) || '0'
		}))

		return { beesInData, beesOutData, lastMetric, tableData }
	}, [movementData])

	if (!movementData || movementData.code) {
		if (movementData?.code) {
			return <ErrorMsg error={movementData} />
		}
		return (
			<p style="color:#bbb">
				<T>Bee entrance movement was not reported this week.</T>
			</p>
		)
	}

	if (beesInData.length === 0 && beesOutData.length === 0) {
		return (
			<p style="color:#bbb">
				<T>Bee entrance movement was not reported this week.</T>
			</p>
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
