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

interface MultiHiveEntranceDetectedChartProps {
	entranceDataByHive: Record<string, {
		hiveName: string
		data: {
			code?: string
			message?: string
			metrics?: Array<{
				time: string
				detectedBees: number | null
			}>
		}
	}>
	chartRefs: React.MutableRefObject<any[]>
	syncCharts: (sourceChart: any) => void
}

export default function MultiHiveEntranceDetectedChart({ entranceDataByHive, chartRefs, syncCharts }: MultiHiveEntranceDetectedChartProps) {
	const { seriesData, tableData, hasData } = useMemo(() => {
		const seriesData: Record<string, { data: any[], hiveName: string }> = {}
		const tableData = []
		let hasData = false

		Object.entries(entranceDataByHive).forEach(([hiveId, { hiveName, data }]) => {
			if (!data || data.code || !data.metrics || data.metrics.length === 0) return

			const detectedData = deduplicateByTime(
				data.metrics
					.filter(m => m.detectedBees != null && m.detectedBees > 0)
					.map(m => ({
						time: Math.floor(new Date(m.time).getTime() / 1000),
						value: m.detectedBees
					}))
			)

			if (detectedData.length > 0) {
				seriesData[hiveId] = { data: detectedData, hiveName }
				hasData = true

				detectedData.forEach(item => {
					tableData.push({
						Hive: hiveName,
						Time: new Date(item.time * 1000).toLocaleString(),
						'Detected Bees': item.value
					})
				})
			}
		})

		return { seriesData, tableData, hasData }
	}, [entranceDataByHive])

	if (!hasData) {
		return (
			<p style={{ color: '#bbb' }}>
				<T>Detected bees data not available for selected hives.</T>
			</p>
		)
	}

	const colors = ['#00c853', '#ff6f00', '#00acc1', '#e91e63', '#7e57c2']
	const hiveCount = Object.keys(seriesData).length

	return (
		<ChartContainer
			emoji="👁️"
			title={t('Detected Bees Comparison')}
			value={`${hiveCount} ${hiveCount === 1 ? 'hive' : 'hives'}`}
			info={t('Total unique bees detected in the frame during the processing period')}
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

