import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import MultiHiveEntranceSpeedChart from '@/shared/charts/MultiHiveEntranceSpeedChart'
import MultiHiveEntranceDetectedChart from '@/shared/charts/MultiHiveEntranceDetectedChart'
import MultiHiveEntranceStationaryChart from '@/shared/charts/MultiHiveEntranceStationaryChart'
import MultiHiveEntranceInteractionsChart from '@/shared/charts/MultiHiveEntranceInteractionsChart'
import InfoIcon from '@/shared/infoIcon'
import TimeRangeSelector from './components/TimeRangeSelector'
import HiveSelector from './components/HiveSelector'
import ChartToggles from './components/ChartToggles'
import WeatherSection from './components/WeatherSection'
import ApiarySelector from './components/ApiarySelector'

const LS_KEYS = {
	SELECTED_APIARY: 'timeView.selectedApiaryId',
	SELECTED_HIVES: 'timeView.selectedHiveIds',
	ENABLED_CHARTS: 'timeView.enabledCharts',
	SHOW_IDEAL_CURVE: 'timeView.showIdealCurve'
}

const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
	try {
		const stored = localStorage.getItem(key)
		return stored ? JSON.parse(stored) : defaultValue
	} catch {
		return defaultValue
	}
}

const saveToLocalStorage = <T,>(key: string, value: T): void => {
	try {
		localStorage.setItem(key, JSON.stringify(value))
	} catch (e) {
		console.error('Failed to save to localStorage:', e)
	}
}

const HIVES_QUERY = gql`
	query HIVES {
		apiaries {
			id
			name
			lat
			lng
			hives {
				id
				hiveNumber
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
	const [searchParams, setSearchParams] = useSearchParams()
	const { chartRefs, syncCharts } = useChartSync()
	const scrollHandledRef = useRef(false)

	const urlHiveId = searchParams.get('hiveId')
	const urlApiaryId = searchParams.get('apiaryId')
	const urlChartType = searchParams.get('chartType')
	const urlScrollTo = searchParams.get('scrollTo')

	const [selectedApiaryId, setSelectedApiaryId] = useState<string | null>(() =>
		loadFromLocalStorage(LS_KEYS.SELECTED_APIARY, null)
	)
	const [selectedHiveIds, setSelectedHiveIds] = useState<string[]>(() =>
		loadFromLocalStorage(LS_KEYS.SELECTED_HIVES, [])
	)
	const [timeRangeDays, setTimeRangeDays] = useState(90)
	const [showIdealCurve, setShowIdealCurve] = useState(() =>
		loadFromLocalStorage(LS_KEYS.SHOW_IDEAL_CURVE, true)
	)
	const [enabledCharts, setEnabledCharts] = useState(() =>
		loadFromLocalStorage(LS_KEYS.ENABLED_CHARTS, {
			population: true,
			weight: true,
			temperature: true,
			entrance: true,
			entranceSpeed: true,
			entranceDetected: true,
			entranceStationary: true,
			entranceInteractions: true,
			weather: true,
			weatherTemperature: true,
			wind: true,
			rain: true,
			solarRadiation: true,
			cloudCover: true,
			pollen: true,
			pollution: true
		})
	)

	const { data: gqlData } = useQuery(HIVES_QUERY, {})

	useEffect(() => {
		if (gqlData?.apiaries?.length > 0 && !selectedApiaryId) {
			setSelectedApiaryId(gqlData.apiaries[0].id)
		}
	}, [gqlData, selectedApiaryId])

	useEffect(() => {
		saveToLocalStorage(LS_KEYS.SELECTED_APIARY, selectedApiaryId)
	}, [selectedApiaryId])

	useEffect(() => {
		saveToLocalStorage(LS_KEYS.SELECTED_HIVES, selectedHiveIds)
	}, [selectedHiveIds])

	useEffect(() => {
		saveToLocalStorage(LS_KEYS.ENABLED_CHARTS, enabledCharts)
	}, [enabledCharts])

	useEffect(() => {
		saveToLocalStorage(LS_KEYS.SHOW_IDEAL_CURVE, showIdealCurve)
	}, [showIdealCurve])

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

	useEffect(() => {
		if (urlHiveId && allHives && hiveToApiaryMap) {
			const targetHive = allHives.find(h => h.id === urlHiveId)
			if (targetHive) {
				const apiaryId = hiveToApiaryMap[urlHiveId]?.id
				if (apiaryId && apiaryId !== selectedApiaryId) {
					setSelectedApiaryId(apiaryId)
				}

				if (!selectedHiveIds.includes(urlHiveId)) {
					setSelectedHiveIds(prev => [...prev, urlHiveId])
				}
			}
		}
	}, [urlHiveId, allHives, hiveToApiaryMap, selectedApiaryId, selectedHiveIds])

	useEffect(() => {
		if (urlApiaryId && urlApiaryId !== selectedApiaryId) {
			setSelectedApiaryId(urlApiaryId)
		}
	}, [urlApiaryId, selectedApiaryId])

	useEffect(() => {
		if (urlChartType && enabledCharts.hasOwnProperty(urlChartType)) {
			if (!enabledCharts[urlChartType]) {
				setEnabledCharts(prev => ({ ...prev, [urlChartType]: true }))
			}
		}
	}, [urlChartType, enabledCharts])

	useEffect(() => {
		if (urlScrollTo && !scrollHandledRef.current && enabledCharts[urlScrollTo]) {
			const timer = setTimeout(() => {
				const chartElement = document.querySelector(`[data-chart-type="${urlScrollTo}"]`)
				if (chartElement) {
					chartElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
					scrollHandledRef.current = true

					const newParams = new URLSearchParams(searchParams)
					newParams.delete('scrollTo')
					setSearchParams(newParams, { replace: true })
				}
			}, 500)

			return () => clearTimeout(timer)
		}
	}, [urlScrollTo, enabledCharts, searchParams, setSearchParams])

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
						avgSpeed
						p95Speed
						stationaryBees
						detectedBees
						beeInteractions
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
					hiveName: hive.hiveNumber ? `#${hive.hiveNumber}` : hive.id,
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
			const displayName = hive.hiveNumber ? `Hive #${hive.hiveNumber}` : `Hive ${hive.id}`
			weightDataByHive[hive.id] = {
				hiveName: displayName,
				data: telemetryData[`hive_${hive.id}_weight`] || {}
			}
			temperatureDataByHive[hive.id] = {
				hiveName: displayName,
				data: telemetryData[`hive_${hive.id}_temp`] || {}
			}
			entranceDataByHive[hive.id] = {
				hiveName: displayName,
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
						<div data-chart-type="population">
							<PopulationChart
								inspectionsByHive={inspectionsByHive}
								showIdealCurve={showIdealCurve}
								chartRefs={chartRefs}
								syncCharts={syncCharts}
							/>
						</div>
					)}

					{enabledCharts.weight && (
						<div data-chart-type="weight">
							<MultiHiveWeightChart
								weightDataByHive={weightDataByHive}
								chartRefs={chartRefs}
								syncCharts={syncCharts}
								selectedApiaryId={selectedApiaryId}
							/>
						</div>
					)}

					{enabledCharts.temperature && (
						<div data-chart-type="temperature">
							<MultiHiveTemperatureChart
								temperatureDataByHive={temperatureDataByHive}
								chartRefs={chartRefs}
								syncCharts={syncCharts}
								selectedApiaryId={selectedApiaryId}
							/>
						</div>
					)}

					{enabledCharts.entrance && (
						<div data-chart-type="entrance">
							<MultiHiveEntranceChart
								entranceDataByHive={entranceDataByHive}
								chartRefs={chartRefs}
								syncCharts={syncCharts}
							/>
						</div>
					)}

					{enabledCharts.entranceSpeed && (
						<div data-chart-type="entranceSpeed">
							<MultiHiveEntranceSpeedChart
								entranceDataByHive={entranceDataByHive}
								chartRefs={chartRefs}
								syncCharts={syncCharts}
							/>
						</div>
					)}

					{enabledCharts.entranceDetected && (
						<div data-chart-type="entranceDetected">
							<MultiHiveEntranceDetectedChart
								entranceDataByHive={entranceDataByHive}
								chartRefs={chartRefs}
								syncCharts={syncCharts}
							/>
						</div>
					)}

					{enabledCharts.entranceStationary && (
						<div data-chart-type="entranceStationary">
							<MultiHiveEntranceStationaryChart
								entranceDataByHive={entranceDataByHive}
								chartRefs={chartRefs}
								syncCharts={syncCharts}
							/>
						</div>
					)}

					{enabledCharts.entranceInteractions && (
						<div data-chart-type="entranceInteractions">
							<MultiHiveEntranceInteractionsChart
								entranceDataByHive={entranceDataByHive}
								chartRefs={chartRefs}
								syncCharts={syncCharts}
							/>
						</div>
					)}

					{enabledCharts.weather && (
						<WeatherSection
							apiaries={relevantApiaries}
							days={timeRangeDays}
							chartRefs={chartRefs}
							syncCharts={syncCharts}
							enabledCharts={{
								temperature: enabledCharts.weatherTemperature,
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
