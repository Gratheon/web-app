import { LineSeries, PriceLine } from 'lightweight-charts-react-components'
import { useMemo } from 'react'

import T, { useTranslation as t, usePlural } from '@/shared/translate'
import ChartContainer from './ChartContainer'
import { formatMetricData } from './formatters'
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

interface MultiHiveTemperatureChartProps {
	temperatureDataByHive: Record<string, {
		hiveName: string
		data: {
			code?: string
			message?: string
			metrics?: Array<{ t: string; v: number }>
		}
	}>
	chartRefs: React.MutableRefObject<any[]>
	syncCharts: (sourceChart: any) => void
	selectedApiaryId?: string | null
}

export default function MultiHiveTemperatureChart({ temperatureDataByHive, chartRefs, syncCharts, selectedApiaryId }: MultiHiveTemperatureChartProps) {
	const { data: alertRulesData } = useQuery(ALERT_RULES_QUERY, {
		variables: { metricType: 'TEMPERATURE' }
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

		Object.entries(temperatureDataByHive).forEach(([hiveId, { hiveName, data }]) => {
			hives.push({ id: hiveId, name: hiveName })

			if (!data || data.code || !data.metrics || data.metrics.length === 0) return

			const formattedData = formatMetricData(data.metrics)
			if (formattedData.length > 0) {
				seriesData[hiveId] = {
					data: formattedData,
					hiveName
				}
				hasData = true

				formattedData.forEach(item => {
					tableData.push({
						Hive: hiveName,
						Time: new Date(item.time * 1000).toLocaleString(),
						'Temperature (°C)': item.value
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
			maxValue: maxValue === -Infinity ? 50 : maxValue + padding
		}
	}, [temperatureDataByHive])

	if (!hasData) {
		return (
			<p style="color:#bbb">
				<T>Temperature data not available for selected hives.</T>
			</p>
		)
	}

	const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7']
	const hiveCount = Object.keys(seriesData).length
	const hiveLabel = usePlural(hiveCount, 'hive')

	return (
		<ChartContainer
			emoji="🌡️"
			title={t('Hive Temperature Comparison')}
			value={`${hiveCount} ${hiveLabel}`}
			info={t('Compare internal temperature across multiple hives')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			showTable={true}
			tableData={tableData}
			chartOptions={{ height: 300 }}
			metricType="TEMPERATURE"
			metricLabel="hive temperature"
			hives={hives}
			timeFrom={timeFrom}
			timeTo={timeTo}
			minValue={minValue}
			maxValue={maxValue}
			selectedApiaryId={selectedApiaryId}
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
									title: `${rule.conditionType} ${rule.thresholdValue}°C`
								}}
							/>
						))}
					</LineSeries>
				)
			})}
		</ChartContainer>
	)
}

