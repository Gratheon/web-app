import { useRef, useEffect, useState } from 'react'
import { Chart } from 'lightweight-charts-react-components'
import ChartHeading from '@/shared/chartHeading'

interface ChartContainerProps {
	title: string
	value?: string
	info?: string
	chartRefs?: React.MutableRefObject<any[]>
	syncCharts?: (sourceChart: any) => void
	chartOptions?: any
	children: React.ReactNode
	showTable?: boolean
	tableData?: Array<{ label: string; value: any }>
}

export default function ChartContainer({
	title,
	value,
	info,
	chartRefs,
	syncCharts,
	chartOptions = {},
	children,
	showTable = false,
	tableData = []
}: ChartContainerProps) {
	const chartApiRef = useRef(null)
	const [showTableView, setShowTableView] = useState(false)

	useEffect(() => {
		if (chartApiRef.current && chartRefs && syncCharts) {
			chartRefs.current.push(chartApiRef.current)

			const handleVisibleTimeRangeChange = () => {
				if (chartApiRef.current) {
					syncCharts(chartApiRef.current)
				}
			}

			chartApiRef.current.timeScale().subscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange)

			return () => {
				const currentChart = chartApiRef.current
				if (chartRefs && chartRefs.current) {
					chartRefs.current = chartRefs.current.filter(c => c !== currentChart)
				}
				if (currentChart) {
					try {
						currentChart.timeScale().unsubscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange)
					} catch (e) {
						console.error('Failed to unsubscribe:', e)
					}
				}
			}
		}
	}, [chartApiRef.current, chartRefs, syncCharts])

	const handleChartInit = (chart: any) => {
		chartApiRef.current = chart
	}

	const defaultChartOptions = {
		layout: {
			attributionLogo: false,
		},
		timeScale: {
			timeVisible: true,
			secondsVisible: false,
			fixLeftEdge: true,
			fixRightEdge: true,
		},
		...chartOptions
	}

	const exportToCSV = () => {
		if (tableData.length === 0) return

		const headers = Object.keys(tableData[0])
		const csvContent = [
			headers.join(','),
			...tableData.map(row => headers.map(h => row[h]).join(','))
		].join('\n')

		const blob = new Blob([csvContent], { type: 'text/csv' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.csv`
		a.click()
		URL.revokeObjectURL(url)
	}

	return (
		<div style="padding-bottom: 20px;">
			<div style="display: flex; justify-content: space-between; align-items: center;">
				<ChartHeading title={title} value={value} info={info} />
				{showTable && tableData.length > 0 && (
					<div style="display: flex; gap: 8px;">
						<button
							onClick={() => setShowTableView(!showTableView)}
							style="padding: 4px 8px; font-size: 12px; cursor: pointer;"
						>
							{showTableView ? '📊 Chart' : '📋 Table'}
						</button>
						<button
							onClick={exportToCSV}
							style="padding: 4px 8px; font-size: 12px; cursor: pointer;"
						>
							📥 CSV
						</button>
					</div>
				)}
			</div>

			{showTableView && tableData.length > 0 ? (
				<div style="max-height: 400px; overflow: auto; border: 1px solid #eee; margin-top: 8px;">
					<table style="width: 100%; border-collapse: collapse;">
						<thead style="position: sticky; top: 0; background: #f5f5f5;">
							<tr>
								{Object.keys(tableData[0]).map(header => (
									<th key={header} style="border: 1px solid #ddd; padding: 8px; text-align: left;">
										{header}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{tableData.map((row, idx) => (
								<tr key={idx}>
									{Object.values(row).map((cell, cellIdx) => (
										<td key={cellIdx} style="border: 1px solid #ddd; padding: 8px;">
											{cell}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<Chart
					onInit={handleChartInit}
					options={defaultChartOptions}
					containerProps={{ style: { width: '100%', height: '200px' } }}
				>
					{children}
				</Chart>
			)}
		</div>
	)
}

