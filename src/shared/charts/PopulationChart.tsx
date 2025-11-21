import { LineSeries, AreaSeries, Markers } from 'lightweight-charts-react-components'
import { useMemo } from 'react'

import T, { useTranslation as t } from '@/shared/translate'
import ChartContainer from './ChartContainer'
import InfoIcon from '@/shared/infoIcon'

interface PopulationChartProps {
	inspectionsByHive: Record<string, Array<{ date: Date; population?: number; hiveName: string }>>
	showIdealCurve: boolean
	chartRefs: React.MutableRefObject<any[]>
	syncCharts: (sourceChart: any) => void
}

const idealPopulationCurve = [
	{ month: 0, value: 10000 },
	{ month: 2, value: 15000 },
	{ month: 5, value: 40000 },
	{ month: 8, value: 35000 },
	{ month: 11, value: 12000 }
]

function interpolateIdealCurve(curve: { month: number; value: number }[]) {
	const result = []
	const year = new Date().getFullYear()

	for (let i = 0; i < curve.length - 1; i++) {
		const start = curve[i]
		const end = curve[i + 1]
		const monthDiff = end.month - start.month
		const daysBetween = monthDiff * 30

		for (let day = 0; day <= daysBetween; day++) {
			const ratio = day / daysBetween
			const value = start.value + (end.value - start.value) * ratio
			const date = new Date(year, 0, 1 + start.month * 30 + day)
			const timestamp = Math.floor(date.getTime() / 1000)

			if (result.length === 0 || result[result.length - 1].time !== timestamp) {
				result.push({
					time: timestamp as any,
					value: Math.round(value)
				})
			}
		}
	}

	return result
}

export default function PopulationChart({ inspectionsByHive, showIdealCurve, chartRefs, syncCharts }: PopulationChartProps) {
	const { idealData, seriesData, tableData } = useMemo(() => {
		const idealData = interpolateIdealCurve(idealPopulationCurve)

		const seriesData: Record<string, { data: any[], hiveName: string, markers: any[] }> = {}

		Object.entries(inspectionsByHive).forEach(([hiveId, insList]) => {
			const data = insList
				.filter(ins => ins.population && ins.population > 0)
				.map(ins => ({
					time: Math.floor(ins.date.getTime() / 1000) as any,
					value: ins.population
				}))

			if (data.length > 0) {
				const colors = ['#1976d2', '#9c27b0', '#f57c00', '#00897b', '#e91e63']
				const colorIndex = Object.keys(seriesData).length % colors.length
				const color = colors[colorIndex]

				const markers = data.map(d => ({
					time: d.time,
					position: 'inBar' as const,
					color: color,
					shape: 'circle' as const,
				}))

				seriesData[hiveId] = {
					data,
					hiveName: insList[0]?.hiveName || `Hive ${hiveId}`,
					markers
				}
			}
		})

		const tableData = []
		Object.entries(seriesData).forEach(([_, { data, hiveName }]) => {
			data.forEach(d => {
				tableData.push({
					Hive: hiveName,
					Time: new Date(d.time * 1000).toLocaleString(),
					Population: d.value
				})
			})
		})

		return { idealData, seriesData, tableData }
	}, [inspectionsByHive])

	if (Object.keys(seriesData).length === 0) {
		return (
			<div style={{
				padding: '16px',
				background: '#f9f9f9',
				borderRadius: '8px',
				border: '1px solid #e0e0e0'
			}}>
				<p style={{ margin: 0, color: '#666', display: 'flex', alignItems: 'center' }}>
					<strong>No population data available.</strong>
					<InfoIcon>
						<p style={{ margin: '0 0 8px 0' }}>
							<strong>To see colony population trends on this chart:</strong>
						</p>
						<ol style={{ margin: '0 0 12px 16px', paddingLeft: 0 }}>
							<li>Go to a hive page and click the <strong>"Inspections"</strong> tab</li>
							<li>Create or edit an inspection</li>
							<li>Add the <strong>bee count</strong> (estimated colony population)</li>
							<li>Save the inspection</li>
						</ol>
						<p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
							💡 <em>Tip: Regular inspections with population estimates help track colony growth over time and identify potential swarming or decline.</em>
						</p>
					</InfoIcon>
				</p>
			</div>
		)
	}

	return (
		<ChartContainer
			title={t('Colony Population') + ' 🐝'}
			value={`${Object.keys(seriesData).length} ${Object.keys(seriesData).length === 1 ? 'hive' : 'hives'}`}
			info={t('Track colony population over time across multiple hives')}
			chartRefs={chartRefs}
			syncCharts={syncCharts}
			showTable={true}
			tableData={tableData}
			chartOptions={{
				height: 300
			}}
		>
			{showIdealCurve && (
				<AreaSeries
					data={idealData}
					options={{
						topColor: 'rgba(0, 200, 83, 0.4)',
						bottomColor: 'rgba(0, 200, 83, 0.05)',
						lineColor: '#00c853',
						lineWidth: 2,
						title: 'Ideal Population',
					}}
				/>
			)}

			{Object.entries(seriesData).map(([hiveId, { data, hiveName, markers }]) => (
				<LineSeries
					key={hiveId}
					data={data}
					options={{
						color: markers[0].color,
						lineWidth: 2,
						title: hiveName,
					}}
				>
					<Markers markers={markers} />
				</LineSeries>
			))}
		</ChartContainer>
	)
}
