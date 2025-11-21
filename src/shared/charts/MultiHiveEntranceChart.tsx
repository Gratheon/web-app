import { LineSeries } from 'lightweight-charts-react-components'
import { useMemo } from 'react'

import T, { useTranslation as t } from '@/shared/translate'
import ChartContainer from './ChartContainer'
import { formatEntranceMovementData } from './formatters'

interface MultiHiveEntranceChartProps {
	entranceDataByHive: Record<string, {
		hiveName: string
		data: {
			code?: string
			message?: string
			metrics?: Array<{
				time: string
				beesIn: number | null
				beesOut: number | null
				netFlow: number | null
			}>
		}
	}>
	chartRefs: React.MutableRefObject<any[]>
	syncCharts: (sourceChart: any) => void
}

export default function MultiHiveEntranceChart({ entranceDataByHive, chartRefs, syncCharts }: MultiHiveEntranceChartProps) {
	const { seriesData, tableData, hasData } = useMemo(() => {
		const seriesData: Record<string, { netFlowData: any[], hiveName: string }> = {}
		const tableData = []
		let hasData = false

		Object.entries(entranceDataByHive).forEach(([hiveId, { hiveName, data }]) => {
			if (!data || data.code || !data.metrics || data.metrics.length === 0) return

			const { beesInData, beesOutData } = formatEntranceMovementData(data.metrics)

			const netFlowData = beesInData.map((inEntry) => {
				const outEntry = beesOutData.find(out => out.time === inEntry.time)
				return {
					time: inEntry.time,
					value: Math.round((inEntry.value - (outEntry?.value || 0)) * 100) / 100
				}
			})

			if (netFlowData.length > 0) {
				seriesData[hiveId] = {
					netFlowData,
					hiveName
				}
				hasData = true

				netFlowData.forEach(item => {
					tableData.push({
						Hive: hiveName,
						Time: new Date(item.time * 1000).toLocaleString(),
						'Net Flow': item.value
					})
				})
			}
		})

		return { seriesData, tableData, hasData }
	}, [entranceDataByHive])

	if (!hasData) {
		return (
			<p style="color:#bbb">
				<T>Entrance activity data not available for selected hives.</T>
			</p>
		)
	}

	const colors = ['#00c853', '#ff6f00', '#00acc1', '#e91e63', '#7e57c2']
	const hiveCount = Object.keys(seriesData).length

	return (
		<ChartContainer
			title={t('Hive Entrance Activity Comparison') + ' 🐝'}
			value={`${hiveCount} ${hiveCount === 1 ? 'hive' : 'hives'}`}
			info={t('Compare net bee flow across multiple hives')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			showTable={true}
			tableData={tableData}
			chartOptions={{ height: 300 }}
		>
			{Object.entries(seriesData).map(([hiveId, { netFlowData, hiveName }], index) => {
				const color = colors[index % colors.length]
				return (
					<LineSeries
						key={hiveId}
						data={netFlowData}
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
