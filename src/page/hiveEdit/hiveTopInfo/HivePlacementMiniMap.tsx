import { useMemo } from 'preact/hooks'
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

export default function HivePlacementMiniMap({ apiaryId, selectedHiveId }: Props) {
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

	const hives = (apiaryData?.apiary?.hives || []) as Hive[]

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
		<div className={styles.miniMapCircle}>
			<Canvas
				canvasWidth={MINI_MAP_SIZE}
				canvasHeight={MINI_MAP_SIZE}
				placements={placements}
				obstacles={(placementData?.apiaryObstacles || []) as Obstacle[]}
				hives={hives}
				sunAngle={90}
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
				showShadows={false}
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
