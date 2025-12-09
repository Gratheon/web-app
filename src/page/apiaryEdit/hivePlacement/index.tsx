import { useState, useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useQuery, useMutation } from '../../../api'
import Loader from '../../../shared/loader'
import ErrorMsg from '../../../shared/messageError'
import T from '../../../shared/translate'
import HiveIcon from '../../../shared/hive'
import { getBoxes } from '@/models/boxes'
import Canvas from './Canvas'
import Toolbar from './Toolbar'
import Tips from './Tips'
import HiveList from './HiveList'
import { HivePlacement as HivePlacementType, Obstacle, Hive, HIVE_SIZE, CANVAS_HEIGHT } from './types'
import { GET_HIVE_PLACEMENTS, UPDATE_HIVE_PLACEMENT, ADD_OBSTACLE, UPDATE_OBSTACLE, DELETE_OBSTACLE } from './graphql'
import { mobileStyles } from './styles'

interface Props {
	apiaryId: string
	hives: Hive[]
	selectedHiveId?: string | null
	onHiveSelect?: (hiveId: string | null) => void
}

const isMobile = () => {
	return typeof window !== 'undefined' && (
		'ontouchstart' in window ||
		navigator.maxTouchPoints > 0 ||
		window.innerWidth <= 768
	)
}

export default function HivePlacement({ apiaryId, hives, selectedHiveId, onHiveSelect }: Props) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [canvasWidth, setCanvasWidth] = useState(800)
	const [placements, setPlacements] = useState<Map<string, HivePlacementType>>(new Map())
	const [initializedPlacements, setInitializedPlacements] = useState(false)
	const [obstacles, setObstacles] = useState<Obstacle[]>([])
	const [selectedHive, setSelectedHive] = useState<string | null>(selectedHiveId || null)
	const [selectedObstacle, setSelectedObstacle] = useState<string | null>(null)
	const [isDragging, setIsDragging] = useState(false)
	const [isDraggingRotation, setIsDraggingRotation] = useState(false)
	const [isDraggingObstacle, setIsDraggingObstacle] = useState(false)
	const [isDraggingObstacleRotation, setIsDraggingObstacleRotation] = useState(false)
	const [isResizingObstacle, setIsResizingObstacle] = useState(false)
	const [isDraggingHeight, setIsDraggingHeight] = useState(false)
	const [isPanning, setIsPanning] = useState(false)
	const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
	const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
	const [sunAngle, setSunAngle] = useState(90)
	const [autoRotate, setAutoRotate] = useState(true)
	const [addingObstacle, setAddingObstacle] = useState<'CIRCLE' | 'RECTANGLE' | null>(null)
	const [showHiveList, setShowHiveList] = useState(false)
	const [isMobileDevice, setIsMobileDevice] = useState(false)

	const handleRadius = isMobileDevice ? 16 : 8

	const { data, loading, error } = useQuery(GET_HIVE_PLACEMENTS, { variables: { apiaryId } })

	const [updatePlacement] = useMutation(UPDATE_HIVE_PLACEMENT)
	const [addObstacleMutation] = useMutation(ADD_OBSTACLE)
	const [updateObstacleMutation] = useMutation(UPDATE_OBSTACLE)
	const [deleteObstacleMutation] = useMutation(DELETE_OBSTACLE)

	const selectedHiveBoxes = useLiveQuery(
		() => selectedHive ? getBoxes({ hiveId: +selectedHive }) : Promise.resolve([]),
		[selectedHive]
	)

	useEffect(() => {
		setIsMobileDevice(isMobile())
	}, [])

	useEffect(() => {
		if (selectedHiveId !== undefined && selectedHiveId !== selectedHive) {
			setSelectedHive(selectedHiveId)
		}
	}, [selectedHiveId])

	useEffect(() => {
		if (onHiveSelect) {
			onHiveSelect(selectedHive)
		}
	}, [selectedHive])

	useEffect(() => {
		const updateCanvasWidth = () => {
			if (containerRef.current) {
				const width = containerRef.current.offsetWidth
				setCanvasWidth(Math.max(isMobile() ? 320 : 600, width))
			}
		}

		setTimeout(updateCanvasWidth, 100)
		const observer = new ResizeObserver(updateCanvasWidth)
		if (containerRef.current) {
			observer.observe(containerRef.current)
		}
		window.addEventListener('resize', updateCanvasWidth)
		return () => {
			observer.disconnect()
			window.removeEventListener('resize', updateCanvasWidth)
		}
	}, [])

	useEffect(() => {
		if (loading || !hives.length) return
		if (initializedPlacements && placements.size > 0) return

		const map = new Map()

		if (data?.hivePlacements) {
			data.hivePlacements.forEach((p: HivePlacementType) => {
				map.set(p.hiveId, p)
			})
		}

		hives.forEach((hive, index) => {
			if (!map.has(hive.id)) {
				map.set(hive.id, {
					hiveId: hive.id,
					x: 150 + (index % 5) * 120,
					y: 150 + Math.floor(index / 5) * 100,
					rotation: 180
				})
			}
		})

		setPlacements(map)
		setInitializedPlacements(true)
	}, [data, hives.length, initializedPlacements, loading, placements.size])

	useEffect(() => {
		if (loading) return
		if (data?.apiaryObstacles) {
			const obstaclesWithHeight = data.apiaryObstacles.map((obs: Obstacle) => ({
				...obs,
				objectHeight: obs.objectHeight ?? (obs.type === 'CIRCLE' ? 150 : 100)
			}))
			setObstacles(obstaclesWithHeight)
		}
	}, [data, loading])

	useEffect(() => {
		if (autoRotate) {
			const interval = setInterval(() => {
				setSunAngle((prev) => {
					if (prev >= 270) return 90
					return prev + 1
				})
			}, 50)
			return () => clearInterval(interval)
		}
	}, [autoRotate])

	const handleCanvasClick = (x: number, y: number) => {
		if (addingObstacle) {
			const objectHeight = addingObstacle === 'CIRCLE' ? 150 : 100
			const obstacleForMutation = {
				type: addingObstacle,
				x,
				y,
				width: addingObstacle === 'RECTANGLE' ? 80 : undefined,
				height: addingObstacle === 'RECTANGLE' ? 60 : undefined,
				radius: addingObstacle === 'CIRCLE' ? 40 : undefined,
				rotation: 0,
				label: addingObstacle === 'CIRCLE' ? 'Tree' : 'House'
			}
			addObstacleMutation({ apiaryId, obstacle: obstacleForMutation }).then((result) => {
				if (result?.data?.addApiaryObstacle?.id) {
					setObstacles([...obstacles, { ...obstacleForMutation, objectHeight, id: result.data.addApiaryObstacle.id }])
				}
			})
			setAddingObstacle(null)
			return
		}

		for (const obs of obstacles) {
			let isInside = false
			if (obs.type === 'CIRCLE' && obs.radius) {
				const dist = Math.sqrt((x - obs.x) ** 2 + (y - obs.y) ** 2)
				isInside = dist <= obs.radius
			} else if (obs.type === 'RECTANGLE' && obs.width && obs.height) {
				const rotRad = (obs.rotation || 0) * (Math.PI / 180)
				const dx = x - obs.x
				const dy = y - obs.y
				const localX = dx * Math.cos(-rotRad) - dy * Math.sin(-rotRad)
				const localY = dx * Math.sin(-rotRad) + dy * Math.cos(-rotRad)
				isInside = Math.abs(localX) <= obs.width / 2 && Math.abs(localY) <= obs.height / 2
			}
			if (isInside) {
				setSelectedObstacle(obs.id)
				setSelectedHive(null)
				return
			}
		}

		for (const hive of hives) {
			const placement = placements.get(hive.id)
			if (placement) {
				const dist = Math.sqrt((x - placement.x) ** 2 + (y - placement.y) ** 2)
				if (dist <= HIVE_SIZE / 2 + 5) {
					setSelectedHive(hive.id)
					setSelectedObstacle(null)
					return
				}
			}
		}

		setSelectedHive(null)
		setSelectedObstacle(null)
	}

	const handleCanvasMouseDown = (x: number, y: number, e?: any) => {
		if (e && (e.button === 1 || e.button === 2 || e.shiftKey)) {
			setIsPanning(true)
			setLastPanPoint({ x, y })
			if (e.button === 2) {
				e.preventDefault()
			}
			return
		}

		if (selectedObstacle) {
			const obs = obstacles.find(o => o.id === selectedObstacle)
			if (obs) {
				if (obs.type === 'CIRCLE' && obs.radius) {
					const heightHandleY = obs.y + obs.radius + 30
					const heightHandleDist = Math.sqrt((x - obs.x) ** 2 + (y - heightHandleY) ** 2)
					if (heightHandleDist <= handleRadius) {
						setIsDraggingHeight(true)
						return
					}

					const resizeHandleDist = Math.sqrt((x - (obs.x + obs.radius)) ** 2 + (y - obs.y) ** 2)
					if (resizeHandleDist <= handleRadius) {
						setIsResizingObstacle(true)
						return
					}
					const centerDist = Math.sqrt((x - obs.x) ** 2 + (y - obs.y) ** 2)
					if (centerDist <= obs.radius) {
						setIsDraggingObstacle(true)
						return
					}
				} else if (obs.type === 'RECTANGLE' && obs.width && obs.height) {
					const heightHandleDistance = Math.sqrt((obs.width / 2) ** 2 + (obs.height / 2) ** 2) + 40
					const heightHandleDist = Math.sqrt((x - obs.x) ** 2 + (y - (obs.y + heightHandleDistance)) ** 2)
					if (heightHandleDist <= handleRadius) {
						setIsDraggingHeight(true)
						return
					}

					const rotHandleDistance = Math.sqrt((obs.width / 2) ** 2 + (obs.height / 2) ** 2) + 20
					const rotHandleDist = Math.sqrt((x - (obs.x + rotHandleDistance)) ** 2 + (y - obs.y) ** 2)
					if (rotHandleDist <= handleRadius) {
						setIsDraggingObstacleRotation(true)
						return
					}

					const rotRad = (obs.rotation || 0) * (Math.PI / 180)
					const resizeHandleX = obs.x + (obs.width / 2 * Math.cos(rotRad) - obs.height / 2 * Math.sin(rotRad))
					const resizeHandleY = obs.y + (obs.width / 2 * Math.sin(rotRad) + obs.height / 2 * Math.cos(rotRad))
					const resizeHandleDist = Math.sqrt((x - resizeHandleX) ** 2 + (y - resizeHandleY) ** 2)
					if (resizeHandleDist <= handleRadius) {
						setIsResizingObstacle(true)
						return
					}

					const dx = x - obs.x
					const dy = y - obs.y
					const localX = dx * Math.cos(-rotRad) - dy * Math.sin(-rotRad)
					const localY = dx * Math.sin(-rotRad) + dy * Math.cos(-rotRad)
					if (Math.abs(localX) <= obs.width / 2 && Math.abs(localY) <= obs.height / 2) {
						setIsDraggingObstacle(true)
						return
					}
				}
			}
		}

		if (selectedHive) {
			const placement = placements.get(selectedHive)
			if (placement) {
				const rotHandleDistance = HIVE_SIZE / 2 + 20
				const rotHandleAngle = (placement.rotation || 0) * (Math.PI / 180)
				const rotHandleX = placement.x + rotHandleDistance * Math.sin(rotHandleAngle)
				const rotHandleY = placement.y - rotHandleDistance * Math.cos(rotHandleAngle)
				const rotHandleDist = Math.sqrt((x - rotHandleX) ** 2 + (y - rotHandleY) ** 2)

				if (rotHandleDist <= 8) {
					setIsDraggingRotation(true)
					return
				}

				const dist = Math.sqrt((x - placement.x) ** 2 + (y - placement.y) ** 2)
				if (dist <= HIVE_SIZE / 2 + 5) {
					setIsDragging(true)
					return
				}
			}
		}

		for (const obs of obstacles) {
			let isInside = false
			if (obs.type === 'CIRCLE' && obs.radius) {
				const dist = Math.sqrt((x - obs.x) ** 2 + (y - obs.y) ** 2)
				isInside = dist <= obs.radius
			} else if (obs.type === 'RECTANGLE' && obs.width && obs.height) {
				const rotRad = (obs.rotation || 0) * (Math.PI / 180)
				const dx = x - obs.x
				const dy = y - obs.y
				const localX = dx * Math.cos(-rotRad) - dy * Math.sin(-rotRad)
				const localY = dx * Math.sin(-rotRad) + dy * Math.cos(-rotRad)
				isInside = Math.abs(localX) <= obs.width / 2 && Math.abs(localY) <= obs.height / 2
			}
			if (isInside) {
				setSelectedObstacle(obs.id)
				setSelectedHive(null)
				setIsDraggingObstacle(true)
				return
			}
		}

		for (const hive of hives) {
			const placement = placements.get(hive.id)
			if (placement) {
				const dist = Math.sqrt((x - placement.x) ** 2 + (y - placement.y) ** 2)
				if (dist <= HIVE_SIZE / 2 + (isMobileDevice ? 15 : 5)) {
					setSelectedHive(hive.id)
					setSelectedObstacle(null)
					setIsDragging(true)
					return
				}
			}
		}
	}

	const handleCanvasMouseMove = (x: number, y: number) => {
		if (isPanning) {
			const dx = x - lastPanPoint.x
			const dy = y - lastPanPoint.y
			setPanOffset({ x: panOffset.x + dx, y: panOffset.y + dy })
			setLastPanPoint({ x, y })
			return
		}

		if (selectedObstacle) {
			const obs = obstacles.find(o => o.id === selectedObstacle)
			if (obs) {
				if (isDraggingHeight) {
					const baseY = obs.type === 'CIRCLE' && obs.radius ?
						obs.y + obs.radius :
						obs.y + Math.sqrt((obs.width! / 2) ** 2 + (obs.height! / 2) ** 2)
					const heightDelta = y - baseY
					const newHeight = Math.max(20, Math.min(300, heightDelta * 2))
					const newObstacles = obstacles.map(o =>
						o.id === selectedObstacle ? { ...o, objectHeight: newHeight } : o
					)
					setObstacles(newObstacles)
					return
				} else if (isDraggingObstacle) {
					const newObstacles = obstacles.map(o =>
						o.id === selectedObstacle ? { ...o, x, y } : o
					)
					setObstacles(newObstacles)
				} else if (isResizingObstacle) {
					if (obs.type === 'CIRCLE') {
						const newRadius = Math.sqrt((x - obs.x) ** 2 + (y - obs.y) ** 2)
						const newObstacles = obstacles.map(o =>
							o.id === selectedObstacle ? { ...o, radius: Math.max(20, newRadius) } : o
						)
						setObstacles(newObstacles)
					} else if (obs.type === 'RECTANGLE' && obs.width && obs.height) {
						const rotRad = (obs.rotation || 0) * (Math.PI / 180)
						const dx = x - obs.x
						const dy = y - obs.y
						const localX = dx * Math.cos(-rotRad) - dy * Math.sin(-rotRad)
						const localY = dx * Math.sin(-rotRad) + dy * Math.cos(-rotRad)
						const newObstacles = obstacles.map(o =>
							o.id === selectedObstacle ? {
								...o,
								width: Math.max(30, Math.abs(localX) * 2),
								height: Math.max(30, Math.abs(localY) * 2)
							} : o
						)
						setObstacles(newObstacles)
					}
				} else if (isDraggingObstacleRotation && obs.type === 'RECTANGLE') {
					const dx = x - obs.x
					const dy = y - obs.y
					const angle = Math.atan2(dy, dx) * (180 / Math.PI)
					const newObstacles = obstacles.map(o =>
						o.id === selectedObstacle ? { ...o, rotation: angle } : o
					)
					setObstacles(newObstacles)
				}
				return
			}
		}

		if (!selectedHive) return

		const placement = placements.get(selectedHive)
		if (!placement) return

		if (isDragging) {
			const newPlacement = {
				...placement,
				x: Math.max(HIVE_SIZE, Math.min(canvasWidth - HIVE_SIZE, x)),
				y: Math.max(HIVE_SIZE, Math.min(CANVAS_HEIGHT - HIVE_SIZE, y))
			}
			setPlacements(new Map(placements.set(selectedHive, newPlacement)))
		} else if (isDraggingRotation) {
			const dx = x - placement.x
			const dy = y - placement.y
			const angle = Math.atan2(dx, -dy) * (180 / Math.PI)
			const newRotation = (angle + 360) % 360
			const newPlacement = { ...placement, rotation: newRotation }
			setPlacements(new Map(placements.set(selectedHive, newPlacement)))
		}
	}

	const handleCanvasMouseUp = () => {
		if ((isDraggingObstacle || isResizingObstacle || isDraggingObstacleRotation || isDraggingHeight) && selectedObstacle) {
			const obs = obstacles.find(o => o.id === selectedObstacle)
			if (obs) {
				updateObstacleMutation({
					id: selectedObstacle,
					obstacle: {
						type: obs.type,
						x: obs.x,
						y: obs.y,
						width: obs.width,
						height: obs.height,
						radius: obs.radius,
						rotation: obs.rotation,
						label: obs.label
					}
				})
			}
		}

		if ((isDragging || isDraggingRotation) && selectedHive) {
			const placement = placements.get(selectedHive)
			if (placement) {
				updatePlacement({
					apiaryId,
					hiveId: selectedHive,
					x: placement.x,
					y: placement.y,
					rotation: placement.rotation
				})
			}
		}
		setIsDragging(false)
		setIsDraggingRotation(false)
		setIsDraggingObstacle(false)
		setIsDraggingObstacleRotation(false)
		setIsResizingObstacle(false)
		setIsDraggingHeight(false)
		setIsPanning(false)
	}

	const rotateHive = (direction: number) => {
		if (!selectedHive) return
		const placement = placements.get(selectedHive)
		if (placement) {
			const newRotation = (placement.rotation + direction + 360) % 360
			const newPlacement = { ...placement, rotation: newRotation }
			setPlacements(new Map(placements.set(selectedHive, newPlacement)))
			updatePlacement({
				apiaryId,
				hiveId: selectedHive,
				x: placement.x,
				y: placement.y,
				rotation: newRotation
			})
		}
	}

	const handleDeleteObstacle = () => {
		if (!selectedObstacle) return
		deleteObstacleMutation({ id: selectedObstacle }).then(() => {
			setObstacles(obstacles.filter((o) => o.id !== selectedObstacle))
			setSelectedObstacle(null)
		})
	}

	const handleAddObstacle = (type: 'CIRCLE' | 'RECTANGLE') => {
		setAddingObstacle(addingObstacle === type ? null : type)
	}

	const toggleAutoRotate = () => {
		setAutoRotate(!autoRotate)
	}

	if (loading) return <Loader />
	if (error) return <ErrorMsg error={error} />

	const getSelectionName = () => {
		if (selectedHive) {
			const hive = hives.find(h => h.id === selectedHive)
			return `Hive #${hive?.hiveNumber || selectedHive.slice(0, 4)}`
		}
		if (selectedObstacle) {
			const obs = obstacles.find(o => o.id === selectedObstacle)
			return obs?.label || 'Obstacle'
		}
		return null
	}

	const selectionName = getSelectionName()

	return (
		<div ref={containerRef} style={mobileStyles.container(isMobileDevice)}>
			<div style={mobileStyles.header(isMobileDevice)}>
				<p style={mobileStyles.description(isMobileDevice)}><T>Position your hives optimally considering sun movement, shadows, and flight patterns</T></p>
			</div>

			{isMobileDevice && showHiveList && (
				<HiveList
					hives={hives}
					placements={placements}
					selectedHive={selectedHive}
					onSelectHive={setSelectedHive}
				/>
			)}


			<div style={{ position: 'relative' }}>
				{selectedHive && !isMobileDevice && (
					<div
						onClick={() => window.location.href = `/apiaries/${apiaryId}/hives/${selectedHive}`}
						style={{
							position: 'absolute',
							top: '180px',
							right: '20px',
							backgroundColor: '#FFF9C4',
							borderLeft: '4px solid #FFA000',
							padding: '12px',
							zIndex: 10,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: '8px',
							boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
							cursor: 'pointer',
							transition: 'transform 0.2s, box-shadow 0.2s'
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.transform = 'scale(1.05)'
							e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)'
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.transform = 'scale(1)'
							e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
						}}
					>
						<HiveIcon boxes={selectedHiveBoxes || []} size={60} />
						<div style={{
							fontSize: '12px',
							fontWeight: 'bold',
							textAlign: 'center'
						}}>
							{(() => {
								const hive = hives.find(h => h.id === selectedHive)
								return `#${hive?.hiveNumber || selectedHive.slice(0, 4)}`
							})()}
							{(() => {
								const hive = hives.find(h => h.id === selectedHive)
								return hive?.boxCount ? ` (${hive.boxCount})` : ''
							})()}
						</div>
					</div>
				)}

					<Canvas
					canvasWidth={canvasWidth}
					placements={placements}
					obstacles={obstacles}
					hives={hives}
					sunAngle={sunAngle}
					autoRotate={autoRotate}
					selectedHive={selectedHive}
					selectedObstacle={selectedObstacle}
					addingObstacle={addingObstacle}
					isDragging={isDragging}
					isDraggingRotation={isDraggingRotation}
					isDraggingObstacle={isDraggingObstacle}
					isResizingObstacle={isResizingObstacle}
					isDraggingObstacleRotation={isDraggingObstacleRotation}
					isDraggingHeight={isDraggingHeight}
					isPanning={isPanning}
					panOffset={panOffset}
					isMobile={isMobileDevice}
					onClick={handleCanvasClick}
					onMouseDown={handleCanvasMouseDown}
					onMouseMove={handleCanvasMouseMove}
					onMouseUp={handleCanvasMouseUp}
					onSunAngleChange={setSunAngle}
					onAutoRotateToggle={toggleAutoRotate}
				/>
			</div>

			{isMobileDevice && selectedHive && (
				<div
					onClick={() => window.location.href = `/apiaries/${apiaryId}/hives/${selectedHive}`}
					style={{
						padding: '12px 20px',
						backgroundColor: '#FFF9C4',
						borderLeft: '4px solid #FFA000',
						marginTop: '10px',
						marginBottom: '10px',
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
						cursor: 'pointer'
					}}
				>
					<HiveIcon boxes={selectedHiveBoxes || []} size={40} />
					<div style={{
						fontSize: '14px',
						fontWeight: 'bold'
					}}>
						{(() => {
							const hive = hives.find(h => h.id === selectedHive)
							return `Hive #${hive?.hiveNumber || selectedHive.slice(0, 4)}`
						})()}
						{(() => {
							const hive = hives.find(h => h.id === selectedHive)
							return hive?.boxCount ? ` (${hive.boxCount} boxes)` : ''
						})()}
					</div>
				</div>
			)}

			<Toolbar
				addingObstacle={addingObstacle}
				selectedHive={selectedHive}
				selectedObstacle={selectedObstacle}
				isMobile={isMobileDevice}
				showHiveList={showHiveList}
				onAddObstacle={handleAddObstacle}
				onRotateHive={rotateHive}
				onDeleteObstacle={handleDeleteObstacle}
				onToggleHiveList={() => setShowHiveList(!showHiveList)}
			/>

			{!isMobileDevice && <Tips />}
		</div>
	)
}

