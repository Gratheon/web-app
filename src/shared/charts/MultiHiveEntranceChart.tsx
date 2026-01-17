import { LineSeries, PriceLine } from 'lightweight-charts-react-components'
import { useMemo } from 'react'

import T, { useTranslation as t, usePlural } from '@/shared/translate'
import ChartContainer from './ChartContainer'
import { formatEntranceMovementData } from './formatters'
import { gql, useQuery } from '@/api'
import InfoIcon from '@/shared/infoIcon'

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
	const { data: alertRulesData } = useQuery(ALERT_RULES_QUERY, {
		variables: { metricType: 'ENTRANCE_ACTIVITY' }
	})

	const { seriesData, tableData, hasData, hives, timeFrom, timeTo, minValue, maxValue } = useMemo(() => {
		const seriesData: Record<string, { netFlowData: any[], hiveName: string }> = {}
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
					minValue = Math.min(minValue, item.value)
					maxValue = Math.max(maxValue, item.value)
					timeFrom = Math.min(timeFrom, item.time)
					timeTo = Math.max(timeTo, item.time)
				})
			}
		})

		const padding = Math.max(Math.abs(maxValue - minValue) * 0.1, 10)
		return {
			seriesData,
			tableData,
			hasData,
			hives,
			timeFrom: timeFrom === Infinity ? undefined : timeFrom,
			timeTo: timeTo === -Infinity ? undefined : timeTo,
			minValue: minValue === Infinity ? -100 : minValue - padding,
			maxValue: maxValue === -Infinity ? 100 : maxValue + padding
		}
	}, [entranceDataByHive])

	if (!hasData) {
		return (
			<div style={{
				padding: '16px',
				background: '#f9f9f9',
				borderRadius: '8px',
				border: '1px solid #e0e0e0'
			}}>
				<p style={{ margin: 0, color: '#666', display: 'flex', alignItems: 'center' }}>
					<span style={{ marginRight: '8px' }}>🚪</span>
					<strong><T>Entrance activity data not available for selected hives.</T></strong>
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

	const colors = ['#00c853', '#ff6f00', '#00acc1', '#e91e63', '#7e57c2']
	const hiveCount = Object.keys(seriesData).length
	const hiveLabel = usePlural(hiveCount, 'hive')

	return (
		<ChartContainer
			emoji="🐝"
			title={t('Hive Entrance Activity Comparison')}
			value={`${hiveCount} ${hiveLabel}`}
			info={t('Compare net bee flow across multiple hives')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			showTable={true}
			tableData={tableData}
			chartOptions={{ height: 300 }}
			metricType="ENTRANCE_ACTIVITY"
			metricLabel="entrance activity"
			hives={hives}
			timeFrom={timeFrom}
			timeTo={timeTo}
			minValue={minValue}
			maxValue={maxValue}
		>
			{Object.entries(seriesData).map(([hiveId, { netFlowData, hiveName }], index) => {
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
						data={netFlowData}
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
