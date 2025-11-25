import { useState, useMemo, useEffect } from 'react'
import styles from './styles.module.less'
import Loader from '@/shared/loader'
import { useLiveQuery } from 'dexie-react-hooks'
import { getHives, bulkUpsertHives } from '@/models/hive'
import { listInspections } from '@/models/inspections'
import { useQuery, gql } from '@/api'
import imageURL from '@/assets/flower.png'
import { useChartSync } from '@/shared/charts/useChartSync'
import PopulationChart from '@/shared/charts/PopulationChart'
import MultiHiveWeightChart from '@/shared/charts/MultiHiveWeightChart'
import MultiHiveTemperatureChart from '@/shared/charts/MultiHiveTemperatureChart'
import MultiHiveEntranceChart from '@/shared/charts/MultiHiveEntranceChart'
import InfoIcon from '@/shared/infoIcon'
import TimeRangeSelector from './components/TimeRangeSelector'
import HiveSelector from './components/HiveSelector'
import ChartToggles from './components/ChartToggles'
import WeatherSection from './components/WeatherSection'
import ApiarySelector from './components/ApiarySelector'

const HIVES_QUERY = gql`
	query HIVES {
		apiaries {
			id
			name
			lat
			lng
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
	const [selectedApiaryId, setSelectedApiaryId] = useState<string | null>(null)
	const [selectedHiveIds, setSelectedHiveIds] = useState<string[]>([])
	const [timeRangeDays, setTimeRangeDays] = useState(90)
	const [showIdealCurve, setShowIdealCurve] = useState(true)
	const [enabledCharts, setEnabledCharts] = useState({
		population: true,
		weight: true,
		temperature: true,
		entrance: true,
		weather: true,
		wind: true,
		rain: true,
		solarRadiation: true,
		cloudCover: true,
		pollen: true,
		pollution: true
	})

	const { data: gqlData } = useQuery(HIVES_QUERY, {})

	useEffect(() => {
		if (gqlData?.apiaries?.length > 0 && !selectedApiaryId) {
			setSelectedApiaryId(gqlData.apiaries[0].id)
		}
	}, [gqlData, selectedApiaryId])

	const allHives = useLiveQuery(async () => {
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

	const hiveToApiaryMap = useMemo(() => {
		if (!gqlData?.apiaries) return {}
		const map: Record<string, any> = {}
		gqlData.apiaries.forEach(apiary => {
			apiary.hives?.forEach(hive => {
				map[hive.id] = {
					id: apiary.id,
					name: apiary.name,
					lat: apiary.lat,
					lng: apiary.lng
				}
			})
		})
		return map
	}, [gqlData])

	const selectedApiary = useMemo(() => {
		if (!selectedApiaryId || !gqlData?.apiaries) return null
		return gqlData.apiaries.find(a => a.id === selectedApiaryId)
	}, [selectedApiaryId, gqlData])

	const hives = useMemo(() => {
		if (!allHives) return []
		if (!selectedApiaryId) return allHives
		return allHives.filter(h => hiveToApiaryMap[h.id]?.id === selectedApiaryId)
	}, [allHives, selectedApiaryId, hiveToApiaryMap])

	const activeHives = useMemo(() => {
		if (!hives) return []
		if (selectedHiveIds.length === 0) return hives
		return hives.filter(h => selectedHiveIds.includes(h.id))
	}, [hives, selectedHiveIds])

	const relevantApiaries = useMemo(() => {
		if (!selectedApiary || !selectedApiary.lat || !selectedApiary.lng) return []
		return [{
			id: selectedApiary.id,
			name: selectedApiary.name,
			lat: selectedApiary.lat,
			lng: selectedApiary.lng
		}]
	}, [selectedApiary])

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

	if (!allHives || !inspections) return <Loader stroke="black" size={0}/>

	if (allHives.length === 0) {
		return (
			<div className={styles.emptyState}>
				<h2>Colony Lifecycle</h2>
				<p>This view shows how colonies develop over time. Add an apiary with a hive to see first data here.</p>
				<img src={imageURL} alt="Flower illustration" />
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
		<div className={styles.pageContainer}>
			<h2>
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

			<div className={styles.contentWrapper}>
				<aside className={styles.sidebar}>
					<ApiarySelector
						apiaries={gqlData?.apiaries || []}
						selectedApiaryId={selectedApiaryId}
						onSelectApiary={setSelectedApiaryId}
					/>

					<TimeRangeSelector
						value={timeRangeDays}
						onChange={setTimeRangeDays}
					/>

					<HiveSelector
						hives={hives}
						selectedHiveIds={selectedHiveIds}
						onToggleHive={toggleHive}
						onToggleAll={toggleAllHives}
					/>

					<ChartToggles
						enabledCharts={enabledCharts}
						showIdealCurve={showIdealCurve}
						onToggleChart={toggleChart}
						onToggleIdealCurve={setShowIdealCurve}
					/>
				</aside>

				<main className={styles.chartsContainer}>
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

					{enabledCharts.weather && (
						<WeatherSection
							apiaries={relevantApiaries}
							days={timeRangeDays}
							chartRefs={chartRefs}
							syncCharts={syncCharts}
							enabledCharts={{
								wind: enabledCharts.wind,
								rain: enabledCharts.rain,
								solarRadiation: enabledCharts.solarRadiation,
								cloudCover: enabledCharts.cloudCover,
								pollen: enabledCharts.pollen,
								pollution: enabledCharts.pollution
							}}
						/>
					)}
				</main>
			</div>
		</div>
	)
}
