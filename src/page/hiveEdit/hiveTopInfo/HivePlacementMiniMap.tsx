import { useEffect, useMemo, useState } from 'preact/hooks'
import { gql, useQuery } from '@/api'
import { useTranslation as t } from '@/shared/translate'
import Canvas from '@/page/apiaryEdit/hivePlacement/Canvas'
import { GET_HIVE_PLACEMENTS } from '@/page/apiaryEdit/hivePlacement/graphql'
import { HivePlacement, Obstacle, Hive, HIVE_SIZE } from '@/page/apiaryEdit/hivePlacement/types'
import styles from './styles.module.less'

const MINI_MAP_SIZE = 340
const MINI_MAP_VIEWPORT_RATIO = 1.4
const MINI_MAP_ZOOM = 1 / MINI_MAP_VIEWPORT_RATIO

interface Props {
	apiaryId: string
	selectedHiveId: string
}

const ONE_MINUTE_MS = 60_000
const NIGHT_START_HOUR = 22
const NIGHT_END_HOUR = 6

const degToRad = (deg: number) => deg * (Math.PI / 180)
const radToDeg = (rad: number) => rad * (180 / Math.PI)
const normalizeDegrees = (deg: number) => ((deg % 360) + 360) % 360

const dayOfYearUTC = (date: Date) => {
	const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 0)
	const current = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
	return Math.floor((current - startOfYear) / ONE_MINUTE_MS / 60 / 24)
}

const getLocalHourAtLongitude = (date: Date, lng: number | null) => {
	if (lng === null || !Number.isFinite(lng)) {
		return date.getHours() + (date.getMinutes() / 60)
	}

	const utcHours = date.getUTCHours() + (date.getUTCMinutes() / 60) + (date.getUTCSeconds() / 3600)
	const solarLocalHours = utcHours + (lng / 15)
	return ((solarLocalHours % 24) + 24) % 24
}

const getSolarAzimuthAndAltitude = (date: Date, lat: number, lng: number) => {
	const day = dayOfYearUTC(date)
	const utcMinutes = (date.getUTCHours() * 60) + date.getUTCMinutes() + (date.getUTCSeconds() / 60)
	const gamma = (2 * Math.PI / 365) * (day - 1 + ((utcMinutes / 60) - 12) / 24)

	const eqTime = 229.18 * (
		0.000075
		+ (0.001868 * Math.cos(gamma))
		- (0.032077 * Math.sin(gamma))
		- (0.014615 * Math.cos(2 * gamma))
		- (0.040849 * Math.sin(2 * gamma))
	)

	const decl = 0.006918
		- (0.399912 * Math.cos(gamma))
		+ (0.070257 * Math.sin(gamma))
		- (0.006758 * Math.cos(2 * gamma))
		+ (0.000907 * Math.sin(2 * gamma))
		- (0.002697 * Math.cos(3 * gamma))
		+ (0.00148 * Math.sin(3 * gamma))

	const trueSolarMinutes = utcMinutes + eqTime + (4 * lng)
	const hourAngle = degToRad((trueSolarMinutes / 4) - 180)
	const latRad = degToRad(lat)

	const cosZenith = (Math.sin(latRad) * Math.sin(decl))
		+ (Math.cos(latRad) * Math.cos(decl) * Math.cos(hourAngle))
	const zenithRad = Math.acos(Math.min(1, Math.max(-1, cosZenith)))
	const altitudeDeg = 90 - radToDeg(zenithRad)

	const azimuthRad = Math.atan2(
		Math.sin(hourAngle),
		(Math.cos(hourAngle) * Math.sin(latRad)) - (Math.tan(decl) * Math.cos(latRad))
	)
	const azimuthDeg = normalizeDegrees(radToDeg(azimuthRad) + 180)

	return { azimuthDeg, altitudeDeg }
}

const fallbackSunAngleByHour = (hour: number) => {
	const daySpan = 16
	const normalized = Math.min(1, Math.max(0, (hour - NIGHT_END_HOUR) / daySpan))
	return 90 + (180 * normalized)
}

export default function HivePlacementMiniMap({ apiaryId, selectedHiveId }: Props) {
	const [now, setNow] = useState(() => new Date())

	const compassN = t('N', 'single letter compass direction: North')
	const compassS = t('S', 'single letter compass direction: South')
	const compassE = t('E', 'single letter compass direction: East')
	const compassW = t('W', 'single letter compass direction: West')
	const building = t('Building', 'obstacle type: building/house structure')
	const tree = t('Tree', 'obstacle type: tree plant')

	const labels = useMemo(() => ({
		compassN,
		compassS,
		compassE,
		compassW,
		building,
		tree,
	}), [compassN, compassS, compassE, compassW, building, tree])

	const {
		data: placementData,
		loading: placementLoading,
		error: placementError,
	} = useQuery(GET_HIVE_PLACEMENTS, { variables: { apiaryId } })

	const {
		data: apiaryData,
		loading: apiaryLoading,
		error: apiaryError,
	} = useQuery(
		gql`
			query hivePlacementMiniMapApiary($apiaryId: ID!) {
				apiary(id: $apiaryId) {
					id
					lat
					lng
					hives {
						id
						hiveNumber
						boxCount
					}
				}
			}
		`,
		{ variables: { apiaryId } },
	)

	useEffect(() => {
		const timer = window.setInterval(() => setNow(new Date()), ONE_MINUTE_MS)
		return () => window.clearInterval(timer)
	}, [])

	const hives = (apiaryData?.apiary?.hives || []) as Hive[]
	const latRaw = apiaryData?.apiary?.lat
	const lngRaw = apiaryData?.apiary?.lng
	const lat = latRaw && !Number.isNaN(Number(latRaw)) ? Number(latRaw) : null
	const lng = lngRaw && !Number.isNaN(Number(lngRaw)) ? Number(lngRaw) : null

	const localHour = getLocalHourAtLongitude(now, lng)
	const isNight = localHour >= NIGHT_START_HOUR || localHour < NIGHT_END_HOUR
	const sunPosition = (lat !== null && lng !== null) ? getSolarAzimuthAndAltitude(now, lat, lng) : null
	const sunAngle = sunPosition?.azimuthDeg ?? fallbackSunAngleByHour(localHour)
	const showShadows = !isNight && (sunPosition ? sunPosition.altitudeDeg > 0 : true)

	const placements = useMemo(() => {
		const map = new Map<string, HivePlacement>()
		const hiveIds = new Set(hives.map((hive) => hive.id))

		for (const placement of (placementData?.hivePlacements || []) as HivePlacement[]) {
			if (hiveIds.has(placement.hiveId)) {
				map.set(placement.hiveId, placement)
			}
		}

		hives.forEach((hive, index) => {
			if (!map.has(hive.id)) {
				map.set(hive.id, {
					hiveId: hive.id,
					x: 150 + (index % 5) * 120,
					y: 150 + Math.floor(index / 5) * 100,
					rotation: 180,
				})
			}
		})

		return map
	}, [hives, placementData])

	const focusPlacement = useMemo(() => {
		return placements.get(selectedHiveId) || placements.values().next().value || null
	}, [placements, selectedHiveId])

	const isHiveHit = (x: number, y: number) => {
		for (const hive of hives) {
			const placement = placements.get(hive.id)
			if (!placement) continue
			const dist = Math.sqrt((x - placement.x) ** 2 + (y - placement.y) ** 2)
			if (dist <= HIVE_SIZE / 2 + 6) {
				return true
			}
		}
		return false
	}

	if (placementLoading || apiaryLoading) {
		return <div className={styles.miniMapLoader} />
	}

	if (placementError || apiaryError) {
		return null
	}

	if (!focusPlacement || hives.length === 0) {
		return null
	}

	return (
		<div className={`${styles.miniMapCircle} ${isNight ? styles.miniMapNight : ''}`}>
			<Canvas
				canvasWidth={MINI_MAP_SIZE}
				canvasHeight={MINI_MAP_SIZE}
				placements={placements}
				obstacles={(placementData?.apiaryObstacles || []) as Obstacle[]}
				hives={hives}
				sunAngle={sunAngle}
				autoRotate={false}
				selectedHive={selectedHiveId}
				selectedObstacle={null}
				addingObstacle={null}
				isDragging={false}
				isDraggingRotation={false}
				isDraggingObstacle={false}
				isResizingObstacle={false}
				isDraggingObstacleRotation={false}
				isDraggingHeight={false}
				isPanning={false}
				panOffset={{ x: 0, y: 0 }}
				readOnly
				isMobile={false}
				labels={labels}
				showCompass={false}
				showShadows={showShadows}
				flightLineLength={24}
				showSelectionHandles={false}
				focusPoint={{ x: focusPlacement.x, y: focusPlacement.y }}
				zoomScale={MINI_MAP_ZOOM}
				allowReadOnlyClick
				readOnlyHitTest={isHiveHit}
				onClick={(x, y) => {
					for (const hive of hives) {
						const placement = placements.get(hive.id)
						if (!placement) continue
						const dist = Math.sqrt((x - placement.x) ** 2 + (y - placement.y) ** 2)
						if (dist <= HIVE_SIZE / 2 + 6) {
							window.location.href = `/apiaries/${apiaryId}/hives/${hive.id}`
							return
						}
					}
				}}
				onMouseDown={() => {}}
				onMouseMove={() => {}}
				onMouseUp={() => {}}
				onSunAngleChange={() => {}}
				onAutoRotateToggle={() => {}}
			/>
		</div>
	)
}
