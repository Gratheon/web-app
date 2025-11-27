import { useRef, useEffect, useState } from 'react'
import { Chart } from 'lightweight-charts-react-components'
import ChartHeading from '@/shared/chartHeading'
import Button from '@/shared/button'
import AlertRulesPanel from './AlertRulesPanel'

interface ChartContainerProps {
	title: string
	emoji?: string
	value?: string
	info?: string
	chartRefs?: React.MutableRefObject<any[]>
	syncCharts?: (sourceChart: any) => void
	chartOptions?: any
	children: React.ReactNode
	showTable?: boolean
	tableData?: Array<{ label: string; value: any }>
	metricType?: string
	metricLabel?: string
	hives?: Array<{ id: string; name: string }>
	timeFrom?: number
	timeTo?: number
	minValue?: number
	maxValue?: number
	showAlertThresholds?: boolean
	selectedApiaryId?: string | null
}

export default function ChartContainer({
	title,
	emoji,
	value,
	info,
	chartRefs,
	syncCharts,
	chartOptions = {},
	children,
	showTable = false,
	tableData = [],
	metricType,
	metricLabel,
	hives = [],
	timeFrom,
	timeTo,
	minValue = 0,
	maxValue = 100,
	showAlertThresholds = true,
	selectedApiaryId
}: ChartContainerProps) {
	const chartApiRef = useRef(null)
	const [showTableView, setShowTableView] = useState(false)
	const [showAlertView, setShowAlertView] = useState(false)
	const [alertCount, setAlertCount] = useState(0)

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
		<div style={{
			paddingBottom: '8px',
			width: '100%',
			maxWidth: '100%',
			boxSizing: 'border-box',
			overflow: 'hidden'
		}}>
			<div style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '4px',
				marginBottom: '4px'
			}}>
				<div style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					flexWrap: 'wrap',
					gap: '8px'
				}}>
					<ChartHeading title={title} emoji={emoji} value={value} info={info} />
					<div style={{
						display: 'flex',
						gap: '4px',
						flexShrink: 0
					}}>
						{metricType && metricLabel && hives.length > 0 && (
							<Button
								size="small"
								onClick={() => {
									setShowAlertView(!showAlertView)
								}}
								color={showAlertView ? 'orange' : 'gray'}
							>
								🔔 Alerts{alertCount > 0 ? ` (${alertCount})` : ''}
							</Button>
						)}
						{showTable && tableData.length > 0 && (
							<>
								<Button
									size="small"
									onClick={() => {
										setShowTableView(!showTableView)
										setShowAlertView(false)
									}}
								>
									{showTableView ? '📊 Chart' : '📋 Table'}
								</Button>
								<Button
									size="small"
									onClick={exportToCSV}
								>
									📥 CSV
								</Button>
							</>
						)}
					</div>
				</div>
			</div>

			{showTableView && tableData.length > 0 ? (
				<div style={{
					maxHeight: '400px',
					overflow: 'auto',
					border: '1px solid #eee',
					marginTop: '8px',
					width: '100%',
					maxWidth: '100%',
					boxSizing: 'border-box'
				}}>
					<table style={{
						width: '100%',
						borderCollapse: 'collapse',
						fontSize: '13px'
					}}>
						<thead style={{
							position: 'sticky',
							top: 0,
							background: '#f5f5f5',
							zIndex: 1
						}}>
							<tr>
								{Object.keys(tableData[0]).map(header => (
									<th key={header} style={{
										border: '1px solid #ddd',
										padding: '8px',
										textAlign: 'left',
										fontSize: '12px'
									}}>
										{header}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{tableData.map((row, idx) => (
								<tr key={idx}>
									{Object.values(row).map((cell, cellIdx) => (
										<td key={cellIdx} style={{
											border: '1px solid #ddd',
											padding: '8px',
											fontSize: '12px'
										}}>
											{cell}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			) : (
				<>
					<div style={{
						width: '100%',
						maxWidth: '100%',
						overflow: 'hidden',
						boxSizing: 'border-box'
					}}>
						<Chart
							onInit={handleChartInit}
							options={defaultChartOptions}
							containerProps={{
								style: {
									width: '100%',
									height: `${chartOptions.height || 300}px`,
									maxWidth: '100%',
									boxSizing: 'border-box'
								}
							}}
						>
							{children}
						</Chart>
					</div>
					{showAlertView && (
						<AlertRulesPanel
							metricType={metricType!}
							metricLabel={metricLabel!}
							hives={hives}
							onAlertCountChange={setAlertCount}
							selectedApiaryId={selectedApiaryId}
						/>
					)}
				</>
			)}
		</div>
	)
}
