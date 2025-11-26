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

interface MultiHiveEntranceStationaryChartProps {
	entranceDataByHive: Record<string, {
		hiveName: string
		data: {
			code?: string
			message?: string
			metrics?: Array<{
				time: string
				stationaryBees: number | null
			}>
		}
	}>
	chartRefs: React.MutableRefObject<any[]>
	syncCharts: (sourceChart: any) => void
}

export default function MultiHiveEntranceStationaryChart({ entranceDataByHive, chartRefs, syncCharts }: MultiHiveEntranceStationaryChartProps) {
	const { seriesData, tableData, hasData, hives } = useMemo(() => {
		const seriesData: Record<string, { data: any[], hiveName: string }> = {}
		const tableData = []
		const hives = []
		let hasData = false

		Object.entries(entranceDataByHive).forEach(([hiveId, { hiveName, data }]) => {
			hives.push({ id: hiveId, name: hiveName })

			if (!data || data.code || !data.metrics || data.metrics.length === 0) return

			const stationaryData = deduplicateByTime(
				data.metrics
					.filter(m => m.stationaryBees != null && m.stationaryBees > 0)
					.map(m => ({
						time: Math.floor(new Date(m.time).getTime() / 1000),
						value: m.stationaryBees
					}))
			)

			if (stationaryData.length > 0) {
				seriesData[hiveId] = { data: stationaryData, hiveName }
				hasData = true

				stationaryData.forEach(item => {
					tableData.push({
						Hive: hiveName,
						Time: new Date(item.time * 1000).toLocaleString(),
						'Stationary Bees': item.value
					})
				})
			}
		})

		return { seriesData, tableData, hasData, hives }
	}, [entranceDataByHive])

	if (!hasData) {
		return (
			<p style={{ color: '#bbb' }}>
				<T>Stationary bees data not available for selected hives.</T>
			</p>
		)
	}

	const colors = ['#00c853', '#ff6f00', '#00acc1', '#e91e63', '#7e57c2']
	const hiveCount = Object.keys(seriesData).length

	return (
		<ChartContainer
			emoji="🐌"
			title={t('Stationary Bees Comparison')}
			value={`${hiveCount} ${hiveCount === 1 ? 'hive' : 'hives'}`}
			info={t('Bees with minimal movement (guard bees, orientation flights)')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			showTable={true}
			tableData={tableData}
			metricType="ENTRANCE_STATIONARY"
			metricLabel="stationary bees"
			hives={hives}
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

