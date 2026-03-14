import { useState, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import styles from './styles.module.less'
import Loader from '@/shared/loader'
import { useLiveQuery } from 'dexie-react-hooks'
import { getHives, bulkUpsertHives } from '@/models/hive'
import { listInspections } from '@/models/inspections'
import { useQuery, gql } from '@/api'
import { getUser } from '@/models/user'
import imageURL from '@/assets/bear.webp'
import thinkerImageURL from '@/assets/thinker.webp'
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
import Button from '@/shared/button'
import TimeRangeSelector from './components/TimeRangeSelector'
import HiveSelector from './components/HiveSelector'
import ChartToggles from './components/ChartToggles'
import WeatherSection from './components/WeatherSection'
import ApiarySelector from './components/ApiarySelector'
import T, { useTranslation as t } from '@/shared/translate'
import { isBillingTierLessThan } from '@/shared/billingTier'

const LS_KEYS = {
	SELECTED_APIARY: 'timeView.selectedApiaryId',
	SELECTED_HIVES: 'timeView.selectedHiveIds',
	ENABLED_CHARTS: 'timeView.enabledCharts',
	SHOW_IDEAL_CURVE: 'timeView.showIdealCurve',
	FILTERS_EXPANDED: 'timeView.filtersExpanded'
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

function buildMockTelemetryData(activeHives: any[], timeRangeDays: number) {
	if (!activeHives?.length) return null

	const now = new Date()
	const points = Math.max(12, Math.min(36, Math.floor(timeRangeDays / 3)))
	const dayStep = Math.max(1, Math.floor(timeRangeDays / points))
	const data: Record<string, any> = {}

	activeHives.forEach((hive, hiveIndex) => {
		const weightMetrics = []
		const entranceMetrics = []
		const populationMetrics = []

		for (let i = points; i >= 0; i--) {
			const date = new Date(now.getTime() - i * dayStep * 24 * 60 * 60 * 1000)
			const ts = date.toISOString()
			const trend = (points - i) / Math.max(1, points)

			const beesIn = Math.round(120 + hiveIndex * 24 + trend * 80 + Math.sin(i / 2) * 18)
			const beesOut = Math.round(110 + hiveIndex * 21 + trend * 72 + Math.cos(i / 3) * 16)
			const netFlow = beesIn - beesOut
			const avgSpeed = Math.max(1.2, 3.2 + Math.sin(i / 4) * 0.7 + hiveIndex * 0.2)
			const p95Speed = Math.max(avgSpeed + 0.8, avgSpeed * 1.45)
			const detectedBees = Math.max(40, beesIn + beesOut + hiveIndex * 15)
			const stationaryBees = Math.max(8, Math.round(detectedBees * 0.18))
			const beeInteractions = Math.max(4, Math.round(detectedBees * 0.06))

			weightMetrics.push({
				t: ts,
				v: Math.round((28 + hiveIndex * 2.6 + trend * 6 + Math.sin(i / 3) * 1.4) * 100) / 100,
			})

			entranceMetrics.push({
				time: ts,
				beesIn,
				beesOut,
				netFlow,
				avgSpeed: Math.round(avgSpeed * 100) / 100,
				p95Speed: Math.round(p95Speed * 100) / 100,
				stationaryBees,
				detectedBees,
				beeInteractions,
			})

			if (i % Math.max(1, Math.floor(points / 8)) === 0) {
				populationMetrics.push({
					t: ts,
					beeCount: Math.round(14000 + hiveIndex * 1800 + trend * 12000 + Math.sin(i / 2) * 900),
					droneCount: Math.round(400 + hiveIndex * 80 + trend * 300),
					varroaMiteCount: Math.max(0, Math.round(8 + hiveIndex * 2 + Math.cos(i / 3) * 3)),
					inspectionId: `mock-${hive.id}-${i}`,
				})
			}
		}

		data[`hive_${hive.id}_weight`] = { metrics: weightMetrics }
		data[`hive_${hive.id}_temp`] = { metrics: [] }
		data[`hive_${hive.id}_entrance`] = { metrics: entranceMetrics }
		data[`hive_${hive.id}_population`] = { metrics: populationMetrics }
	})

	return data
}

export default function TimeView() {
	const [searchParams, setSearchParams] = useSearchParams()
	const { chartRefs, syncCharts } = useChartSync()
	const scrollHandledRef = useRef(false)
	const hiveLabel = t('Hive')
	const user = useLiveQuery(() => getUser(), [], null)
	const isPaywalled = isBillingTierLessThan(user?.billingPlan, 'professional')

	const defaultFiltersExpanded = () => {
		if (typeof window === 'undefined') return true
		return window.innerWidth >= 1024
	}

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
	const [filtersExpanded, setFiltersExpanded] = useState(() =>
		loadFromLocalStorage(LS_KEYS.FILTERS_EXPANDED, defaultFiltersExpanded())
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
	const effectiveEnabledCharts = useMemo(() => {
		if (!isPaywalled) return enabledCharts
		return {
			...enabledCharts,
			weather: false,
			weatherTemperature: false,
			wind: false,
			rain: false,
			solarRadiation: false,
			cloudCover: false,
			pollen: false,
			pollution: false,
		}
	}, [enabledCharts, isPaywalled])

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

	useEffect(() => {
		saveToLocalStorage(LS_KEYS.FILTERS_EXPANDED, filtersExpanded)
	}, [filtersExpanded])

	useEffect(() => {
		if (!isPaywalled) return
		setFiltersExpanded(false)
	}, [isPaywalled])

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
		if (urlChartType && effectiveEnabledCharts.hasOwnProperty(urlChartType)) {
			if (!effectiveEnabledCharts[urlChartType]) {
				setEnabledCharts(prev => ({ ...prev, [urlChartType]: true }))
			}
		}
	}, [urlChartType, effectiveEnabledCharts])

	useEffect(() => {
		if (urlScrollTo && !scrollHandledRef.current && effectiveEnabledCharts[urlScrollTo]) {
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
	}, [urlScrollTo, effectiveEnabledCharts, searchParams, setSearchParams])

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
			hive_${hive.id}_population: populationMetrics(hiveId: "${hive.id}", days: $days) {
				... on PopulationMetricsList {
					metrics {
						t
						beeCount
						droneCount
						varroaMiteCount
						inspectionId
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
		skip: !telemetryQueryString || isPaywalled,
		variables: {
			days: timeRangeDays,
			temperatureTimeRangeMin,
			timeFrom,
			timeTo
		}
	})
	const mockTelemetryData = useMemo(
		() => (isPaywalled ? buildMockTelemetryData(activeHives, timeRangeDays) : null),
		[isPaywalled, activeHives, timeRangeDays]
	)
	const effectiveTelemetryData = isPaywalled ? mockTelemetryData : telemetryData

	const inspections = useLiveQuery(async () => {
		if (isPaywalled) return []
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
	}, [activeHives, isPaywalled], [])

	const inspectionsByHive = useMemo(() => {
		if (!inspections && !effectiveTelemetryData) return {}
		const grouped: Record<string, any[]> = {}

		if (inspections) {
			inspections.forEach(ins => {
				if (!grouped[ins.hiveId]) grouped[ins.hiveId] = []
				grouped[ins.hiveId].push(ins)
			})
		}

		if (effectiveTelemetryData && activeHives) {
			activeHives.forEach(hive => {
				const populationData = effectiveTelemetryData[`hive_${hive.id}_population`]
				if (populationData?.metrics) {
					if (!grouped[hive.id]) grouped[hive.id] = []

					populationData.metrics.forEach(metric => {
						grouped[hive.id].push({
							hiveId: hive.id,
							hiveName: hive.hiveNumber ? `#${hive.hiveNumber}` : hive.id,
							date: new Date(metric.t),
							population: metric.beeCount,
							inspectionId: metric.inspectionId
						})
					})
				}
			})
		}

		Object.keys(grouped).forEach(hiveId => {
			grouped[hiveId].sort((a, b) => a.date.getTime() - b.date.getTime())

			const deduped = []
			const seenKeys = new Set()

			grouped[hiveId].forEach(item => {
				// Create a unique key using timestamp + population + inspectionId
				// This allows multiple data points at the same timestamp if they have different values
				const dedupKey = `${item.date.getTime()}_${item.population}_${item.inspectionId || 'none'}`
				if (!seenKeys.has(dedupKey)) {
					seenKeys.add(dedupKey)
					deduped.push(item)
				}
			})

			grouped[hiveId] = deduped
		})
		return grouped
	}, [inspections, effectiveTelemetryData, activeHives])

	const { weightDataByHive, temperatureDataByHive, entranceDataByHive } = useMemo(() => {
		if (!effectiveTelemetryData || !activeHives) return { weightDataByHive: {}, temperatureDataByHive: {}, entranceDataByHive: {} }

		const weightDataByHive = {}
		const temperatureDataByHive = {}
		const entranceDataByHive = {}

		activeHives.forEach(hive => {
			const displayName = hive.hiveNumber ? `${hiveLabel} #${hive.hiveNumber}` : `${hiveLabel} ${hive.id}`
			weightDataByHive[hive.id] = {
				hiveName: displayName,
				data: effectiveTelemetryData[`hive_${hive.id}_weight`] || {}
			}
			temperatureDataByHive[hive.id] = {
				hiveName: displayName,
				data: effectiveTelemetryData[`hive_${hive.id}_temp`] || {}
			}
			entranceDataByHive[hive.id] = {
				hiveName: displayName,
				data: effectiveTelemetryData[`hive_${hive.id}_entrance`] || {}
			}
		})

		return { weightDataByHive, temperatureDataByHive, entranceDataByHive }
	}, [effectiveTelemetryData, activeHives, hiveLabel])

	const chartDataAvailability = useMemo(() => {
		const hasPopulationData = Object.values(inspectionsByHive).some((entries: any[]) =>
			entries.some(entry => entry.population && entry.population > 0)
		)

		const hasWeightData = Object.values(weightDataByHive).some((hiveData: any) =>
			!hiveData?.data?.code && Array.isArray(hiveData?.data?.metrics) && hiveData.data.metrics.length > 0
		)

		const hasTemperatureData = Object.values(temperatureDataByHive).some((hiveData: any) =>
			!hiveData?.data?.code && Array.isArray(hiveData?.data?.metrics) && hiveData.data.metrics.length > 0
		)

		const hasEntranceData = Object.values(entranceDataByHive).some((hiveData: any) =>
			Array.isArray(hiveData?.data?.metrics) &&
			hiveData.data.metrics.some((m: any) => (m.beesIn ?? 0) > 0)
		)

		const hasEntranceSpeedData = Object.values(entranceDataByHive).some((hiveData: any) =>
			Array.isArray(hiveData?.data?.metrics) &&
			hiveData.data.metrics.some((m: any) => (m.avgSpeed ?? 0) > 0 || (m.p95Speed ?? 0) > 0)
		)

		const hasEntranceDetectedData = Object.values(entranceDataByHive).some((hiveData: any) =>
			Array.isArray(hiveData?.data?.metrics) &&
			hiveData.data.metrics.some((m: any) => (m.detectedBees ?? 0) > 0)
		)

		const hasEntranceStationaryData = Object.values(entranceDataByHive).some((hiveData: any) =>
			Array.isArray(hiveData?.data?.metrics) &&
			hiveData.data.metrics.some((m: any) => (m.stationaryBees ?? 0) > 0)
		)

		const hasEntranceInteractionsData = Object.values(entranceDataByHive).some((hiveData: any) =>
			Array.isArray(hiveData?.data?.metrics) &&
			hiveData.data.metrics.some((m: any) => (m.beeInteractions ?? 0) > 0)
		)

		return {
			population: hasPopulationData,
			weight: hasWeightData,
			temperature: hasTemperatureData,
			entrance: hasEntranceData,
			entranceSpeed: hasEntranceSpeedData,
			entranceDetected: hasEntranceDetectedData,
			entranceStationary: hasEntranceStationaryData,
			entranceInteractions: hasEntranceInteractionsData
		}
	}, [inspectionsByHive, weightDataByHive, temperatureDataByHive, entranceDataByHive])

	const missingSelectedCharts = useMemo(() => {
		const chartDefinitions = [
			{ key: 'population', label: t('Colony Population') },
			{ key: 'weight', label: t('Hive Weight Comparison') },
			{ key: 'temperature', label: t('Hive Temperature Comparison') },
			{ key: 'entrance', label: t('Hive Entrance Activity Comparison') },
			{ key: 'entranceSpeed', label: t('Bee Speed Comparison') },
			{ key: 'entranceDetected', label: t('Detected Bees Comparison') },
			{ key: 'entranceStationary', label: t('Stationary Bees Comparison') },
			{ key: 'entranceInteractions', label: t('Bee Interactions Comparison') }
		]

		return chartDefinitions
			.filter(chart => effectiveEnabledCharts[chart.key] && !chartDataAvailability[chart.key])
			.map(chart => chart.label)
	}, [effectiveEnabledCharts, chartDataAvailability])

	if (!allHives) return <Loader stroke="black" size={0}/>

	if (allHives.length === 0) {
		return (
			<div className={styles.emptyState}>
				<h2><T>Colony Lifecycle</T></h2>
				<p><T>This view shows how colonies develop over time. Add an apiary with a hive to see first data here.</T></p>
				<img src={imageURL} alt="Bear and honey illustration" />
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
			<div className={styles.headerRow}>
				<h2 className={styles.pageTitle}>
					<T>Multi-Hive Analytics</T>
					<InfoIcon>
						<p style={{ margin: '0 0 8px 0' }}>
							<strong><T>About this view:</T></strong>
						</p>
						<p style={{ margin: '0 0 8px 0' }}>
							<T>Compare metrics across multiple hives over time to identify trends and anomalies.</T>
						</p>
						<p style={{ margin: 0 }}>
							<T>Look for correlations between weight drops and swarming, temperature extremes and bee activity, or entrance patterns and colony health. Use the table view (📋) on each chart to export data for deeper analysis.</T>
						</p>
					</InfoIcon>
				</h2>
				<div className={styles.filtersHeader}>
					<Button
						color="white"
						onClick={() => setFiltersExpanded(prev => !prev)}
					>
						{filtersExpanded ? <T>Hide Filters</T> : <T>Show Filters</T>}
					</Button>
				</div>
			</div>

			<div className={styles.contentWrapper}>
				{filtersExpanded && (
					<aside className={styles.filtersGrid}>
						<div className={styles.filterCard}>
							<TimeRangeSelector
								value={timeRangeDays}
								onChange={setTimeRangeDays}
							/>
						</div>

						<div className={styles.filterBlock}>
							<ApiarySelector
								apiaries={gqlData?.apiaries || []}
								selectedApiaryId={selectedApiaryId}
								onSelectApiary={setSelectedApiaryId}
							/>
						</div>

						<div className={styles.filterBlock}>
							<HiveSelector
								hives={hives}
								selectedHiveIds={selectedHiveIds}
								onToggleHive={toggleHive}
							/>
						</div>

						<div className={styles.filterBlock}>
							<ChartToggles
								group="population"
								enabledCharts={effectiveEnabledCharts}
								showIdealCurve={showIdealCurve}
								onToggleChart={toggleChart}
								onToggleIdealCurve={setShowIdealCurve}
							/>
						</div>

						<div className={styles.filterBlock}>
							<ChartToggles
								group="scales"
								enabledCharts={effectiveEnabledCharts}
								showIdealCurve={showIdealCurve}
								onToggleChart={toggleChart}
								onToggleIdealCurve={setShowIdealCurve}
							/>
						</div>

						<div className={styles.filterBlock}>
							<ChartToggles
								group="entrance"
								enabledCharts={effectiveEnabledCharts}
								showIdealCurve={showIdealCurve}
								onToggleChart={toggleChart}
								onToggleIdealCurve={setShowIdealCurve}
							/>
						</div>

						{!isPaywalled && (
							<div className={styles.filterBlock}>
								<ChartToggles
									group="weather"
									enabledCharts={effectiveEnabledCharts}
									showIdealCurve={showIdealCurve}
									onToggleChart={toggleChart}
									onToggleIdealCurve={setShowIdealCurve}
								/>
							</div>
						)}
					</aside>
				)}

				<main className={styles.chartsContainer}>
					{missingSelectedCharts.length > 0 && (
						<div className={styles.groupedNoDataPlaceholder}>
							<img src={thinkerImageURL} alt="Thinker placeholder" />
							<p className={styles.groupedNoDataTitle}>
								<strong><T>No data available for selected charts.</T></strong>
								<InfoIcon>
									<p style={{ margin: '0 0 8px 0' }}>
										<strong><T>How to get data here:</T></strong>
									</p>
									<ol style={{ margin: '0 0 12px 16px', paddingLeft: 0 }}>
										<li><T>For population charts: add inspections and fill in bee count</T></li>
										<li><T>For telemetry charts: connect sensors/cameras and send metrics via API</T></li>
										<li><T>Documentation:</T> <a href="https://gratheon.com/docs/API/REST" target="_blank" rel="noopener noreferrer">gratheon.com/docs/API/REST</a></li>
									</ol>
								</InfoIcon>
							</p>
							<p className={styles.groupedNoDataSubtitle}><T>Currently missing data for:</T></p>
							<ul className={styles.groupedNoDataList}>
								{missingSelectedCharts.map(chartName => (
									<li key={chartName}>{chartName}</li>
								))}
							</ul>
						</div>
					)}

					{effectiveEnabledCharts.population && chartDataAvailability.population && (
						<div data-chart-type="population">
							<PopulationChart
								inspectionsByHive={inspectionsByHive}
								showIdealCurve={showIdealCurve}
								chartRefs={chartRefs}
								syncCharts={syncCharts}
								timeFrom={new Date(timeFrom)}
								timeTo={new Date(timeTo)}
							/>
						</div>
					)}

					{effectiveEnabledCharts.weight && chartDataAvailability.weight && (
						<div data-chart-type="weight">
							<MultiHiveWeightChart
								weightDataByHive={weightDataByHive}
								chartRefs={chartRefs}
								syncCharts={syncCharts}
								selectedApiaryId={selectedApiaryId}
							/>
						</div>
					)}

					{effectiveEnabledCharts.temperature && chartDataAvailability.temperature && (
						<div data-chart-type="temperature">
							<MultiHiveTemperatureChart
								temperatureDataByHive={temperatureDataByHive}
								chartRefs={chartRefs}
								syncCharts={syncCharts}
								selectedApiaryId={selectedApiaryId}
							/>
						</div>
					)}

					{effectiveEnabledCharts.entrance && chartDataAvailability.entrance && (
						<div data-chart-type="entrance">
							<MultiHiveEntranceChart
								entranceDataByHive={entranceDataByHive}
								chartRefs={chartRefs}
								syncCharts={syncCharts}
							/>
						</div>
					)}

					{effectiveEnabledCharts.entranceSpeed && chartDataAvailability.entranceSpeed && (
						<div data-chart-type="entranceSpeed">
							<MultiHiveEntranceSpeedChart
								entranceDataByHive={entranceDataByHive}
								chartRefs={chartRefs}
								syncCharts={syncCharts}
							/>
						</div>
					)}

					{effectiveEnabledCharts.entranceDetected && chartDataAvailability.entranceDetected && (
						<div data-chart-type="entranceDetected">
							<MultiHiveEntranceDetectedChart
								entranceDataByHive={entranceDataByHive}
								chartRefs={chartRefs}
								syncCharts={syncCharts}
							/>
						</div>
					)}

					{effectiveEnabledCharts.entranceStationary && chartDataAvailability.entranceStationary && (
						<div data-chart-type="entranceStationary">
							<MultiHiveEntranceStationaryChart
								entranceDataByHive={entranceDataByHive}
								chartRefs={chartRefs}
								syncCharts={syncCharts}
							/>
						</div>
					)}

					{effectiveEnabledCharts.entranceInteractions && chartDataAvailability.entranceInteractions && (
						<div data-chart-type="entranceInteractions">
							<MultiHiveEntranceInteractionsChart
								entranceDataByHive={entranceDataByHive}
								chartRefs={chartRefs}
								syncCharts={syncCharts}
							/>
						</div>
					)}

					{effectiveEnabledCharts.weather && (
						<WeatherSection
							apiaries={relevantApiaries}
							days={timeRangeDays}
							chartRefs={chartRefs}
							syncCharts={syncCharts}
							enabledCharts={{
								temperature: effectiveEnabledCharts.weatherTemperature,
								wind: effectiveEnabledCharts.wind,
								rain: effectiveEnabledCharts.rain,
								solarRadiation: effectiveEnabledCharts.solarRadiation,
								cloudCover: effectiveEnabledCharts.cloudCover,
								pollen: effectiveEnabledCharts.pollen,
								pollution: effectiveEnabledCharts.pollution
							}}
						/>
					)}

				</main>
			</div>
		</div>
	)
}
