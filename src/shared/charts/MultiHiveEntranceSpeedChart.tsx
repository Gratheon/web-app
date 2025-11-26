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

interface MultiHiveEntranceSpeedChartProps {
	entranceDataByHive: Record<string, {
		hiveName: string
		data: {
			code?: string
			message?: string
			metrics?: Array<{
				time: string
				avgSpeed: number | null
				p95Speed: number | null
			}>
		}
	}>
	chartRefs: React.MutableRefObject<any[]>
	syncCharts: (sourceChart: any) => void
}

export default function MultiHiveEntranceSpeedChart({ entranceDataByHive, chartRefs, syncCharts }: MultiHiveEntranceSpeedChartProps) {
	const { seriesData, tableData, hasData, hives } = useMemo(() => {
		const seriesData: Record<string, { avgSpeedData: any[], p95SpeedData: any[], hiveName: string }> = {}
		const tableData = []
		const hives = []
		let hasData = false

		Object.entries(entranceDataByHive).forEach(([hiveId, { hiveName, data }]) => {
			hives.push({ id: hiveId, name: hiveName })

			if (!data || data.code || !data.metrics || data.metrics.length === 0) return

			const avgSpeedData = deduplicateByTime(
				data.metrics
					.filter(m => m.avgSpeed != null && m.avgSpeed > 0)
					.map(m => ({
						time: Math.floor(new Date(m.time).getTime() / 1000),
						value: Math.round(m.avgSpeed * 100) / 100
					}))
			)

			const p95SpeedData = deduplicateByTime(
				data.metrics
					.filter(m => m.p95Speed != null && m.p95Speed > 0)
					.map(m => ({
						time: Math.floor(new Date(m.time).getTime() / 1000),
						value: Math.round(m.p95Speed * 100) / 100
					}))
			)

			if (avgSpeedData.length > 0 || p95SpeedData.length > 0) {
				seriesData[hiveId] = { avgSpeedData, p95SpeedData, hiveName }
				hasData = true

				avgSpeedData.forEach(item => {
					tableData.push({
						Hive: hiveName,
						Time: new Date(item.time * 1000).toLocaleString(),
						Metric: 'Avg Speed',
						'Speed (px/frame)': item.value
					})
				})
			}
		})

		return { seriesData, tableData, hasData, hives }
	}, [entranceDataByHive])

	if (!hasData) {
		return (
			<p style={{ color: '#bbb' }}>
				<T>Bee speed data not available for selected hives.</T>
			</p>
		)
	}

	const colors = ['#00c853', '#ff6f00', '#00acc1', '#e91e63', '#7e57c2']
	const hiveCount = Object.keys(seriesData).length

	return (
		<ChartContainer
			emoji="💨"
			title={t('Bee Speed Comparison')}
			value={`${hiveCount} ${hiveCount === 1 ? 'hive' : 'hives'}`}
			info={t('Average and P95 bee flight speeds (pixels per frame)')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			showTable={true}
			tableData={tableData}
			chartOptions={{ height: 300 }}
			metricType="ENTRANCE_SPEED"
			metricLabel="bee speed"
			hives={hives}
		>
			{Object.entries(seriesData).map(([hiveId, { avgSpeedData, hiveName }], index) => {
				const color = colors[index % colors.length]
				return (
					<LineSeries
						key={`${hiveId}-avg`}
						data={avgSpeedData}
						options={{
							color,
							lineWidth: 2,
							title: `${hiveName} (avg)`,
						}}
					/>
				)
			})}
		</ChartContainer>
	)
}

