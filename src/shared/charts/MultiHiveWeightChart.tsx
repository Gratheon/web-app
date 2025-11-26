import { LineSeries } from 'lightweight-charts-react-components'
import { useMemo, useState } from 'react'

import T, { useTranslation as t } from '@/shared/translate'
import ChartContainer from './ChartContainer'
import { formatMetricData } from './formatters'
import CreateAlertModal from './CreateAlertModal'
import Button from '@/shared/button'

interface MultiHiveWeightChartProps {
	weightDataByHive: Record<string, {
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

export default function MultiHiveWeightChart({ weightDataByHive, chartRefs, syncCharts }: MultiHiveWeightChartProps) {
	const kgLabel = t('kg', 'Shortest label for the unit of weight in kilograms')
	const [alertModalOpen, setAlertModalOpen] = useState(false)
	const [selectedHiveForAlert, setSelectedHiveForAlert] = useState<string | null>(null)

	const { seriesData, tableData, hasData } = useMemo(() => {
		const seriesData: Record<string, { data: any[], hiveName: string }> = {}
		const tableData = []
		let hasData = false

		Object.entries(weightDataByHive).forEach(([hiveId, { hiveName, data }]) => {
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
						Weight: `${item.value} ${kgLabel}`
					})
				})
			}
		})

		return { seriesData, tableData, hasData }
	}, [weightDataByHive, kgLabel])

	if (!hasData) {
		return (
			<p style="color:#bbb">
				<T>Weight data not available for selected hives.</T>
			</p>
		)
	}

	const colors = ['#1976d2', '#d32f2f', '#388e3c', '#f57c00', '#7b1fa2']
	const hiveCount = Object.keys(seriesData).length

	const handleCreateAlert = (hiveId: string) => {
		setSelectedHiveForAlert(hiveId)
		setAlertModalOpen(true)
	}

	return (
		<>
			<ChartContainer
				emoji="⚖️"
				title={t('Hive Weight Comparison')}
				value={`${hiveCount} ${hiveCount === 1 ? 'hive' : 'hives'}`}
				info={t('Compare weight across multiple hives')}
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
					metricType="WEIGHT"
					metricLabel="hive weight"
					onSuccess={() => {}}
				/>
			)}
		</>
	)
}

