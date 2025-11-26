import { LineSeries } from 'lightweight-charts-react-components'
import { useMemo, useState } from 'react'

import T, { useTranslation as t } from '@/shared/translate'
import ChartContainer from './ChartContainer'
import { formatMetricData } from './formatters'
import CreateAlertModal from './CreateAlertModal'
import Button from '@/shared/button'

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
}

export default function MultiHiveTemperatureChart({ temperatureDataByHive, chartRefs, syncCharts }: MultiHiveTemperatureChartProps) {
	const [alertModalOpen, setAlertModalOpen] = useState(false)
	const [selectedHiveForAlert, setSelectedHiveForAlert] = useState<string | null>(null)

	const { seriesData, tableData, hasData } = useMemo(() => {
		const seriesData: Record<string, { data: any[], hiveName: string }> = {}
		const tableData = []
		let hasData = false

		Object.entries(temperatureDataByHive).forEach(([hiveId, { hiveName, data }]) => {
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
				})
			}
		})

		return { seriesData, tableData, hasData }
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

	const handleCreateAlert = (hiveId: string) => {
		setSelectedHiveForAlert(hiveId)
		setAlertModalOpen(true)
	}

	return (
		<>
			<ChartContainer
				emoji="🌡️"
				title={t('Hive Temperature Comparison')}
				value={`${hiveCount} ${hiveCount === 1 ? 'hive' : 'hives'}`}
				info={t('Compare internal temperature across multiple hives')}
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

			<div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
				{Object.entries(seriesData).map(([hiveId, { hiveName }]) => (
					<Button
						key={hiveId}
						size="small"
						onClick={() => handleCreateAlert(hiveId)}
					>
						🔔 Alert for {hiveName}
					</Button>
				))}
			</div>

			{selectedHiveForAlert && (
				<CreateAlertModal
					isOpen={alertModalOpen}
					onClose={() => {
						setAlertModalOpen(false)
						setSelectedHiveForAlert(null)
					}}
					hiveId={selectedHiveForAlert}
					metricType="TEMPERATURE"
					metricLabel="hive temperature"
					onSuccess={() => {}}
				/>
			)}
		</>
	)
}

