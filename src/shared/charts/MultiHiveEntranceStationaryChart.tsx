import { LineSeries, PriceLine } from 'lightweight-charts-react-components'
import { useMemo } from 'react'

import T, { useTranslation as t, usePlural } from '@/shared/translate'
import ChartContainer from './ChartContainer'
import { gql, useQuery } from '@/api'

const ALERT_RULES_QUERY = gql`
	query alertRules($metricType: String!) {
		alertRules(metricType: $metricType) {
			id
			hiveId
			conditionType
			thresholdValue
			enabled
		}
	}
`

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
	const { data: alertRulesData } = useQuery(ALERT_RULES_QUERY, {
		variables: { metricType: 'ENTRANCE_STATIONARY' }
	})

	const { seriesData, tableData, hasData, hives, timeFrom, timeTo, minValue, maxValue } = useMemo(() => {
		const seriesData: Record<string, { data: any[], hiveName: string }> = {}
		const tableData = []
		const hives = []
		let hasData = false
		let minValue = Infinity
		let maxValue = -Infinity
		let timeFrom = Infinity
		let timeTo = -Infinity

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
					minValue = Math.min(minValue, item.value)
					maxValue = Math.max(maxValue, item.value)
					timeFrom = Math.min(timeFrom, item.time)
					timeTo = Math.max(timeTo, item.time)
				})
			}
		})

		const padding = (maxValue - minValue) * 0.1
		return {
			seriesData,
			tableData,
			hasData,
			hives,
			timeFrom: timeFrom === Infinity ? undefined : timeFrom,
			timeTo: timeTo === -Infinity ? undefined : timeTo,
			minValue: minValue === Infinity ? 0 : Math.max(0, minValue - padding),
			maxValue: maxValue === -Infinity ? 100 : maxValue + padding
		}
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
	const hiveLabel = usePlural(hiveCount, 'hive')

	return (
		<ChartContainer
			emoji="🐌"
			title={t('Stationary Bees Comparison')}
			value={`${hiveCount} ${hiveLabel}`}
			info={t('Bees with minimal movement (guard bees, orientation flights)')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			showTable={true}
			tableData={tableData}
			metricType="ENTRANCE_STATIONARY"
			metricLabel="stationary bees"
			hives={hives}
			chartOptions={{ height: 300 }}
			timeFrom={timeFrom}
			timeTo={timeTo}
			minValue={minValue}
			maxValue={maxValue}
		>
			{Object.entries(seriesData).map(([hiveId, { data, hiveName }], index) => {
				const color = colors[index % colors.length]
				const isFirstSeries = index === 0
				const alertRules = alertRulesData?.alertRules || []
				const relevantRules = alertRules.filter((rule: any) =>
					rule.enabled &&
					(!rule.hiveId || hiveId === rule.hiveId) &&
					(rule.conditionType === 'ABOVE' || rule.conditionType === 'BELOW')
				)

				return (
					<LineSeries
						key={hiveId}
						data={data}
						options={{
							color,
							lineWidth: 2,
							title: hiveName,
						}}
					>
						{isFirstSeries && relevantRules.map((rule: any) => (
							<PriceLine
								key={`threshold-${rule.id}`}
								price={rule.thresholdValue}
								options={{
									color: 'rgba(255, 82, 82, 0.8)',
									lineWidth: 2,
									lineStyle: 2,
									axisLabelVisible: true,
									title: `${rule.conditionType} ${rule.thresholdValue}`
								}}
							/>
						))}
					</LineSeries>
				)
			})}
		</ChartContainer>
	)
}

