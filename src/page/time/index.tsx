import { useState, useMemo } from 'react'
import styles from './styles.module.less'
import Loader from '@/shared/loader'
import { useLiveQuery } from 'dexie-react-hooks'
import { getHives, bulkUpsertHives } from '../../models/hive'
import { listInspections } from '../../models/inspections'
import { useQuery, gql } from '../../api'
import imageURL from '@/assets/flower.png'
import { useChartSync } from '@/shared/charts/useChartSync'
import PopulationChart from '@/shared/charts/PopulationChart'
import MultiHiveWeightChart from '@/shared/charts/MultiHiveWeightChart'
import MultiHiveTemperatureChart from '@/shared/charts/MultiHiveTemperatureChart'
import MultiHiveEntranceChart from '@/shared/charts/MultiHiveEntranceChart'
import InfoIcon from '@/shared/infoIcon'

const HIVES_QUERY = gql`
	query HIVES {
		apiaries {
			id
			hives {
				id
				name
				notes
				status
				inspectionCount
				collapse_date
				collapse_cause
				family {
					id
				}
			}
		}
	}
`

export default function TimeView() {
	const { chartRefs, syncCharts } = useChartSync()
	const [selectedHiveIds, setSelectedHiveIds] = useState<string[]>([])
	const [timeRangeDays, setTimeRangeDays] = useState(90)
	const [showIdealCurve, setShowIdealCurve] = useState(true)
	const [enabledCharts, setEnabledCharts] = useState({
		population: true,
		weight: true,
		temperature: true,
		entrance: true
	})

	const { data: gqlData } = useQuery(HIVES_QUERY, {})
	const hives = useLiveQuery(async () => {
		let localHives = await getHives()
		if ((!localHives || localHives.length === 0) && gqlData && gqlData.apiaries) {
			const allHives = gqlData.apiaries.flatMap(apiary => apiary.hives || [])
			if (allHives.length > 0) {
				await bulkUpsertHives(allHives)
				return allHives
			}
		}
		return localHives
	}, [gqlData], [])

	const activeHives = useMemo(() => {
		if (!hives) return []
		if (selectedHiveIds.length === 0) return hives
		return hives.filter(h => selectedHiveIds.includes(h.id))
	}, [hives, selectedHiveIds])

	const telemetryQueryString = useMemo(() => {
		if (!activeHives.length) return null

		const queries = activeHives.map(hive => `
			hive_${hive.id}_weight: weightKgAggregated(hiveId: "${hive.id}", days: $days, aggregation: DAILY_AVG) {
				... on MetricFloatList {
					metrics { t v }
				}
				... on TelemetryError {
					message
					code
				}
			}
			hive_${hive.id}_temp: temperatureCelsius(hiveId: "${hive.id}", timeRangeMin: $temperatureTimeRangeMin) {
				... on MetricFloatList {
					metrics { t v }
				}
				... on TelemetryError {
					message
					code
				}
			}
			hive_${hive.id}_entrance: entranceMovement(hiveId: "${hive.id}", timeFrom: $timeFrom, timeTo: $timeTo) {
				... on EntranceMovementList {
					metrics {
						time
						beesIn
						beesOut
						netFlow
					}
				}
				... on TelemetryError {
					message
					code
				}
			}
		`).join('\n')

		return gql`
			query MultiHiveTelemetry($days: Int!, $temperatureTimeRangeMin: Int!, $timeFrom: DateTime!, $timeTo: DateTime!) {
				${queries}
			}
		`
	}, [activeHives])

	const { timeFrom, timeTo, temperatureTimeRangeMin } = useMemo(() => {
		const now = new Date()
		const timeFrom = new Date(now.getTime() - timeRangeDays * 24 * 60 * 60 * 1000)
		const maxTempRangeMin = 7 * 24 * 60
		return {
			timeFrom: timeFrom.toISOString(),
			timeTo: now.toISOString(),
			temperatureTimeRangeMin: Math.min(timeRangeDays * 24 * 60, maxTempRangeMin)
		}
	}, [timeRangeDays])

	const { data: telemetryData } = useQuery(telemetryQueryString || HIVES_QUERY, {
		skip: !telemetryQueryString,
		variables: {
			days: timeRangeDays,
			temperatureTimeRangeMin,
			timeFrom,
			timeTo
		}
	})

	const inspections = useLiveQuery(async () => {
		if (!activeHives || activeHives.length === 0) return []
		const allInspections = []
		for (const hive of activeHives) {
			const ins = await listInspections(hive.id)
			allInspections.push(...ins.map(i => {
				let population = null
				try {
					const inspectionData = JSON.parse(i.data || '{}')
					population = inspectionData?.hive?.beeCount || null
				} catch (e) {
					console.error('Failed to parse inspection data:', e)
				}

				return {
					...i,
					hiveName: hive.name,
					hiveId: hive.id,
					date: i.added ? new Date(i.added) : new Date(),
					population
				}
			}))
		}
		return allInspections
	}, [activeHives], [])

	const inspectionsByHive = useMemo(() => {
		if (!inspections) return {}
		const grouped: Record<string, any[]> = {}
		inspections.forEach(ins => {
			if (!grouped[ins.hiveId]) grouped[ins.hiveId] = []
			grouped[ins.hiveId].push(ins)
		})
		Object.keys(grouped).forEach(hiveId => {
			grouped[hiveId].sort((a, b) => a.date.getTime() - b.date.getTime())
		})
		return grouped
	}, [inspections])

	const { weightDataByHive, temperatureDataByHive, entranceDataByHive } = useMemo(() => {
		if (!telemetryData || !activeHives) return { weightDataByHive: {}, temperatureDataByHive: {}, entranceDataByHive: {} }

		const weightDataByHive = {}
		const temperatureDataByHive = {}
		const entranceDataByHive = {}

		activeHives.forEach(hive => {
			weightDataByHive[hive.id] = {
				hiveName: hive.name || `Hive ${hive.id}`,
				data: telemetryData[`hive_${hive.id}_weight`] || {}
			}
			temperatureDataByHive[hive.id] = {
				hiveName: hive.name || `Hive ${hive.id}`,
				data: telemetryData[`hive_${hive.id}_temp`] || {}
			}
			entranceDataByHive[hive.id] = {
				hiveName: hive.name || `Hive ${hive.id}`,
				data: telemetryData[`hive_${hive.id}_entrance`] || {}
			}
		})

		return { weightDataByHive, temperatureDataByHive, entranceDataByHive }
	}, [telemetryData, activeHives])

	if (!hives || !inspections) return <Loader stroke="black" size={0}/>

	if (hives.length === 0) {
		return (
			<div className={styles.flowWrap} style={{width: '100%', textAlign: 'center', padding: '20px 0', color: 'gray'}}>
				<h2>Colony Lifecycle</h2>
				<p>This view shows how colonies develop over time. Add an apiary with a hive to see first data here.</p>
				<img height="64" src={imageURL} alt="Flower illustration" />
			</div>
		)
	}

	const toggleHive = (hiveId: string) => {
		setSelectedHiveIds(prev =>
			prev.includes(hiveId) ? prev.filter(id => id !== hiveId) : [...prev, hiveId]
		)
	}

	const toggleAllHives = () => {
		if (selectedHiveIds.length === hives.length) {
			setSelectedHiveIds([])
		} else {
			setSelectedHiveIds(hives.map(h => h.id))
		}
	}

	const toggleChart = (chartName: string) => {
		setEnabledCharts(prev => ({ ...prev, [chartName]: !prev[chartName] }))
	}

	return (
		<div className={styles.flowWrap} style={{width: '100%'}}>
			<div style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				marginBottom: '16px'
			}}>
				<h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
					Multi-Hive Analytics
					<InfoIcon>
						<p style={{ margin: '0 0 8px 0' }}>
							<strong>About this view:</strong>
						</p>
						<p style={{ margin: '0 0 8px 0' }}>
							Compare metrics across multiple hives over time to identify trends and anomalies.
						</p>
						<p style={{ margin: 0 }}>
							Look for correlations between weight drops and swarming, temperature extremes and bee activity,
							or entrance patterns and colony health. Use the table view (📋) on each chart to export data for deeper analysis.
						</p>
					</InfoIcon>
				</h2>

				<label style={{ fontWeight: 'bold' }}>
					Time Range:
					<select
						value={timeRangeDays}
						onChange={e => setTimeRangeDays(Number(e.target.value))}
						style={{ marginLeft: '8px', padding: '4px 8px' }}
					>
						<option value={7}>Last 7 days</option>
						<option value={30}>Last 30 days</option>
						<option value={90}>Last 90 days</option>
						<option value={180}>Last 6 months</option>
						<option value={365}>Last year</option>
					</select>
				</label>
			</div>

			<div style={{
				background: '#f5f5f5',
				padding: '16px',
				borderRadius: '8px',
				marginBottom: '24px'
			}}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
					<strong>Selected Hives:</strong>
					<button
						onClick={toggleAllHives}
						style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
					>
						{selectedHiveIds.length === hives.length ? 'Deselect All' : 'Select All'}
					</button>
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
						{hives.map(hive => (
							<label key={hive.id} style={{
								cursor: 'pointer',
								userSelect: 'none',
								background: (selectedHiveIds.length === 0 || selectedHiveIds.includes(hive.id)) ? '#e3f2fd' : '#fff',
								padding: '4px 8px',
								borderRadius: '4px',
								border: '1px solid #ccc'
							}}>
								<input
									type="checkbox"
									checked={selectedHiveIds.length === 0 || selectedHiveIds.includes(hive.id)}
									onChange={() => toggleHive(hive.id)}
								/>
								<span style={{ marginLeft: '4px' }}>{hive.name || `Hive ${hive.id}`}</span>
							</label>
						))}
					</div>
				</div>
			</div>

			<div style={{ display: 'flex', gap: '24px' }}>
				<div style={{
					width: '200px',
					flexShrink: 0,
					background: '#f5f5f5',
					padding: '16px',
					borderRadius: '8px',
					height: 'fit-content',
					position: 'sticky',
					top: '16px'
				}}>
					<h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Charts</h3>
					<div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
						<label style={{
							cursor: 'pointer',
							userSelect: 'none',
							display: 'flex',
							alignItems: 'center',
							padding: '8px',
							background: enabledCharts.population ? '#e8f5e9' : 'transparent',
							borderRadius: '4px',
							transition: 'background 0.2s'
						}}>
							<input
								type="checkbox"
								checked={enabledCharts.population}
								onChange={() => toggleChart('population')}
								style={{ marginRight: '8px' }}
							/>
							<span>🐝 Population</span>
						</label>

						{enabledCharts.population && (
							<label style={{
								cursor: 'pointer',
								userSelect: 'none',
								display: 'flex',
								alignItems: 'center',
								paddingLeft: '32px',
								fontSize: '14px'
							}}>
								<input
									type="checkbox"
									checked={showIdealCurve}
									onChange={e => setShowIdealCurve(e.target.checked)}
									style={{ marginRight: '8px' }}
								/>
								<span>Ideal Curve</span>
							</label>
						)}

						<label style={{
							cursor: 'pointer',
							userSelect: 'none',
							display: 'flex',
							alignItems: 'center',
							padding: '8px',
							background: enabledCharts.weight ? '#fff3e0' : 'transparent',
							borderRadius: '4px',
							transition: 'background 0.2s'
						}}>
							<input
								type="checkbox"
								checked={enabledCharts.weight}
								onChange={() => toggleChart('weight')}
								style={{ marginRight: '8px' }}
							/>
							<span>⚖️ Weight</span>
						</label>

						<label style={{
							cursor: 'pointer',
							userSelect: 'none',
							display: 'flex',
							alignItems: 'center',
							padding: '8px',
							background: enabledCharts.temperature ? '#fce4ec' : 'transparent',
							borderRadius: '4px',
							transition: 'background 0.2s'
						}}>
							<input
								type="checkbox"
								checked={enabledCharts.temperature}
								onChange={() => toggleChart('temperature')}
								style={{ marginRight: '8px' }}
							/>
							<span>🌡️ Temperature</span>
						</label>

						<label style={{
							cursor: 'pointer',
							userSelect: 'none',
							display: 'flex',
							alignItems: 'center',
							padding: '8px',
							background: enabledCharts.entrance ? '#e1f5fe' : 'transparent',
							borderRadius: '4px',
							transition: 'background 0.2s'
						}}>
							<input
								type="checkbox"
								checked={enabledCharts.entrance}
								onChange={() => toggleChart('entrance')}
								style={{ marginRight: '8px' }}
							/>
							<span>🚪 Entrance Activity</span>
						</label>
					</div>
				</div>

				<div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
					{enabledCharts.population && (
						<PopulationChart
							inspectionsByHive={inspectionsByHive}
							showIdealCurve={showIdealCurve}
							chartRefs={chartRefs}
							syncCharts={syncCharts}
						/>
					)}

					{enabledCharts.weight && (
						<MultiHiveWeightChart
							weightDataByHive={weightDataByHive}
							chartRefs={chartRefs}
							syncCharts={syncCharts}
						/>
					)}

					{enabledCharts.temperature && (
						<MultiHiveTemperatureChart
							temperatureDataByHive={temperatureDataByHive}
							chartRefs={chartRefs}
							syncCharts={syncCharts}
						/>
					)}

					{enabledCharts.entrance && (
						<MultiHiveEntranceChart
							entranceDataByHive={entranceDataByHive}
							chartRefs={chartRefs}
							syncCharts={syncCharts}
						/>
					)}
				</div>
			</div>
		</div>
	)
}
