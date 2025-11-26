import { LineSeries } from 'lightweight-charts-react-components'
import { useMemo } from 'react'

import T, { useTranslation as t } from '@/shared/translate'
import ChartContainer from './ChartContainer'

function deduplicateByTime(data: Array<{ time: number; value: number }>) {
	const map = new Map<number, number>()
	data.forEach(item => map.set(item.time, item.value))
	return Array.from(map.entries())
		.map(([time, value]) => ({ time, value }))
		.sort((a, b) => a.time - b.time)
}

interface MultiHiveEntranceInteractionsChartProps {
	entranceDataByHive: Record<string, {
		hiveName: string
		data: {
			code?: string
			message?: string
			metrics?: Array<{
				time: string
				beeInteractions: number | null
			}>
		}
	}>
	chartRefs: React.MutableRefObject<any[]>
	syncCharts: (sourceChart: any) => void
}

export default function MultiHiveEntranceInteractionsChart({ entranceDataByHive, chartRefs, syncCharts }: MultiHiveEntranceInteractionsChartProps) {
	const { seriesData, tableData, hasData } = useMemo(() => {
		const seriesData: Record<string, { data: any[], hiveName: string }> = {}
		const tableData = []
		let hasData = false

		Object.entries(entranceDataByHive).forEach(([hiveId, { hiveName, data }]) => {
			if (!data || data.code || !data.metrics || data.metrics.length === 0) return

			const interactionsData = deduplicateByTime(
				data.metrics
					.filter(m => m.beeInteractions != null && m.beeInteractions > 0)
					.map(m => ({
						time: Math.floor(new Date(m.time).getTime() / 1000),
						value: m.beeInteractions
					}))
			)

			if (interactionsData.length > 0) {
				seriesData[hiveId] = { data: interactionsData, hiveName }
				hasData = true

				interactionsData.forEach(item => {
					tableData.push({
						Hive: hiveName,
						Time: new Date(item.time * 1000).toLocaleString(),
						'Bee Interactions': item.value
					})
				})
			}
		})

		return { seriesData, tableData, hasData }
	}, [entranceDataByHive])

	if (!hasData) {
		return (
			<p style={{ color: '#bbb' }}>
				<T>Bee interactions data not available for selected hives.</T>
			</p>
		)
	}

	const colors = ['#00c853', '#ff6f00', '#00acc1', '#e91e63', '#7e57c2']
	const hiveCount = Object.keys(seriesData).length

	return (
		<ChartContainer
			emoji="🤝"
			title={t('Bee Interactions Comparison')}
			value={`${hiveCount} ${hiveCount === 1 ? 'hive' : 'hives'}`}
			info={t('Close proximity events between bees (guarding, trophallaxis, collisions)')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			showTable={true}
			tableData={tableData}
			chartOptions={{ height: 300 }}
		>
			{Object.entries(seriesData).map(([hiveId, { data, hiveName }], index) => {
				const color = colors[index % colors.length]
				return (
					<LineSeries
						key={hiveId}
						data={data}
						options={{
							color,
							lineWidth: 2,
							title: hiveName,
						}}
					/>
				)
			})}
		</ChartContainer>
	)
}

