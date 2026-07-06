import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { useQuery } from '@/api'
import imageURL from '@/assets/bear.webp'
import { bulkUpsertHives, getHives } from '@/models/hive'
import { listInspections } from '@/models/inspections'
import { getUser } from '@/models/user'
import Button from '@/shared/button'
import InfoIcon from '@/shared/infoIcon'
import Loader from '@/shared/loader'
import T, { useTranslation as t } from '@/shared/translate'
import { isBillingTierLessThan } from '@/shared/billingTier'
import { DEFAULT_ENABLED_CHARTS, LS_KEYS } from './constants'
import TimeChartsPanel from './components/TimeChartsPanel'
import TimeFiltersPanel from './components/TimeFiltersPanel'
import styles from './styles.module.less'
import { loadFromLocalStorage, saveToLocalStorage } from './storage'
import {
	buildMockTelemetryData,
	buildTelemetryQuery,
	getTelemetryTimeWindow,
	HIVES_QUERY,
} from './telemetry'

export default function TimeView() {
	const [searchParams, setSearchParams] = useSearchParams()
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
		loadFromLocalStorage(LS_KEYS.ENABLED_CHARTS, DEFAULT_ENABLED_CHARTS)
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
	const safeApiaries = useMemo(
		() =>
			(gqlData?.apiaries || [])
				.filter((apiary) => apiary && apiary.id != null)
				.map((apiary) => ({
					...apiary,
					hives: (apiary.hives || []).filter((hive) => hive && hive.id != null),
				})),
		[gqlData?.apiaries]
	)

	useEffect(() => {
		if (safeApiaries.length > 0 && !selectedApiaryId) {
			setSelectedApiaryId(String(safeApiaries[0].id))
		}
	}, [safeApiaries, selectedApiaryId])

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
		if ((!localHives || localHives.length === 0) && safeApiaries.length > 0) {
			const allHives = safeApiaries.flatMap(apiary => apiary.hives || [])
			if (allHives.length > 0) {
				await bulkUpsertHives(allHives)
				return allHives
			}
		}
		return localHives
	}, [safeApiaries], [])

	const hiveToApiaryMap = useMemo(() => {
		if (!safeApiaries.length) return {}
		const map: Record<string, any> = {}
		safeApiaries.forEach(apiary => {
			apiary.hives?.forEach(hive => {
				map[String(hive.id)] = {
					id: String(apiary.id),
					name: apiary.name,
					lat: apiary.lat,
					lng: apiary.lng,
				}
			})
		})
		return map
	}, [safeApiaries])

	useEffect(() => {
		if (urlHiveId && allHives && hiveToApiaryMap) {
			const targetHive = allHives.find(h => h && String(h.id) === String(urlHiveId))
			if (targetHive) {
				const apiaryId = hiveToApiaryMap[String(urlHiveId)]?.id
				if (apiaryId && apiaryId !== selectedApiaryId) {
					setSelectedApiaryId(String(apiaryId))
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
		if (!selectedApiaryId || !safeApiaries.length) return null
		return safeApiaries.find(a => String(a.id) === String(selectedApiaryId)) || null
	}, [selectedApiaryId, safeApiaries])

	const hives = useMemo(() => {
		if (!allHives) return []
		const normalizedHives = allHives.filter((h) => h && h.id != null)
		if (!selectedApiaryId) return normalizedHives
		return normalizedHives.filter(h => hiveToApiaryMap[String(h.id)]?.id === String(selectedApiaryId))
	}, [allHives, selectedApiaryId, hiveToApiaryMap])

	const activeHives = useMemo(() => {
		if (!hives) return []
		if (selectedHiveIds.length === 0) return hives
		return hives.filter(h => selectedHiveIds.includes(String(h.id)))
	}, [hives, selectedHiveIds])

	const relevantApiaries = useMemo(() => {
		if (!selectedApiary || !selectedApiary.lat || !selectedApiary.lng) return []
		return [{
			id: selectedApiary.id,
			name: selectedApiary.name,
			lat: selectedApiary.lat,
			lng: selectedApiary.lng,
		}]
	}, [selectedApiary])

	const telemetryQueryString = useMemo(
		() => buildTelemetryQuery(activeHives),
		[activeHives]
	)
	const { timeFrom, timeTo, temperatureTimeRangeMin } = useMemo(
		() => getTelemetryTimeWindow(timeRangeDays),
		[timeRangeDays]
	)

	const { data: telemetryData } = useQuery(telemetryQueryString || HIVES_QUERY, {
		skip: !telemetryQueryString || isPaywalled,
		variables: {
			days: timeRangeDays,
			temperatureTimeRangeMin,
			timeFrom,
			timeTo,
		},
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
					population,
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
							inspectionId: metric.inspectionId,
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
				data: effectiveTelemetryData[`hive_${hive.id}_weight`] || {},
			}
			temperatureDataByHive[hive.id] = {
				hiveName: displayName,
				data: effectiveTelemetryData[`hive_${hive.id}_temp`] || {},
			}
			entranceDataByHive[hive.id] = {
				hiveName: displayName,
				data: effectiveTelemetryData[`hive_${hive.id}_entrance`] || {},
			}
		})

		return { weightDataByHive, temperatureDataByHive, entranceDataByHive }
	}, [effectiveTelemetryData, activeHives, hiveLabel])

	if (!allHives) return <Loader stroke="black" size={0}/>

	if (allHives.length === 0) {
		return (
			<div className={styles.emptyState}>
				<h2><T>Colony Lifecycle</T></h2>
				<p><T>This view shows how colonies develop over time. Add an apiary with a hive to see first data here.</T></p>
				<img src={imageURL} alt="Bear and honey illustration" draggable={false} />
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
					<TimeFiltersPanel
						timeRangeDays={timeRangeDays}
						onTimeRangeChange={setTimeRangeDays}
						apiaries={safeApiaries}
						selectedApiaryId={selectedApiaryId}
						onSelectApiary={setSelectedApiaryId}
						hives={hives}
						selectedHiveIds={selectedHiveIds}
						onToggleHive={toggleHive}
						enabledCharts={effectiveEnabledCharts}
						showIdealCurve={showIdealCurve}
						onToggleChart={toggleChart}
						onToggleIdealCurve={setShowIdealCurve}
						isPaywalled={isPaywalled}
					/>
				)}

				<TimeChartsPanel
					enabledCharts={effectiveEnabledCharts}
					inspectionsByHive={inspectionsByHive}
					weightDataByHive={weightDataByHive}
					temperatureDataByHive={temperatureDataByHive}
					entranceDataByHive={entranceDataByHive}
					showIdealCurve={showIdealCurve}
					selectedApiaryId={selectedApiaryId}
					apiaries={relevantApiaries}
					timeRangeDays={timeRangeDays}
					timeFrom={timeFrom}
					timeTo={timeTo}
				/>
			</div>
		</div>
	)
}
