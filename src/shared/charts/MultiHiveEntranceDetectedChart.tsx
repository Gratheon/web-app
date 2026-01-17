import { LineSeries, PriceLine } from 'lightweight-charts-react-components'
import { useMemo } from 'react'

import T, { useTranslation as t, usePlural } from '@/shared/translate'
import ChartContainer from './ChartContainer'
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
	const { data: alertRulesData } = useQuery(ALERT_RULES_QUERY, {
		variables: { metricType: 'ENTRANCE_DETECTED' }
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
			<div style={{
				padding: '16px',
				background: '#f9f9f9',
				borderRadius: '8px',
				border: '1px solid #e0e0e0'
			}}>
				<p style={{ margin: 0, color: '#666', display: 'flex', alignItems: 'center' }}>
					<span style={{ marginRight: '8px' }}>👁️</span>
					<strong><T>Detected bees data not available for selected hives.</T></strong>
					<InfoIcon>
						<p style={{ margin: '0 0 8px 0' }}>
							<strong><T>To start tracking detected bees:</T></strong>
						</p>
						<ol style={{ margin: '0 0 12px 16px', paddingLeft: 0 }}>
							<li><T>Set up video monitoring at hive entrance</T></li>
							<li><T>Use computer vision to detect and count bees</T></li>
							<li><T>Send detection metrics via our REST API</T></li>
							<li><T>View the documentation at</T> <a href="https://gratheon.com/docs/API/REST" target="_blank" rel="noopener noreferrer">gratheon.com/docs/API/REST</a></li>
						</ol>
						<p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
							💡 <em><T>Tip: Tracking total detected bees helps monitor colony activity levels and identify unusual patterns.</T></em>
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
			emoji="👁️"
			title={t('Detected Bees Comparison')}
			value={`${hiveCount} ${hiveLabel}`}
			info={t('Total unique bees detected in the frame during the processing period')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			showTable={true}
			tableData={tableData}
			metricType="ENTRANCE_DETECTED"
			metricLabel="detected bees"
			hives={hives}
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

