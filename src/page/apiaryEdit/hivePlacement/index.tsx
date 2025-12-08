import React, { useState, useEffect, useRef } from 'react'
import { gql, useQuery, useMutation } from '../../../api'
import Loader from '../../../shared/loader'
import ErrorMsg from '../../../shared/messageError'
import Button from '../../../shared/button'
import T from '../../../shared/translate'

const HIVE_SIZE = 30
const CANVAS_HEIGHT = 600

interface HivePlacement {
	hiveId: string
	x: number
	y: number
	rotation: number
}

interface Obstacle {
	id: string
	type: 'CIRCLE' | 'RECTANGLE'
	x: number
	y: number
	width?: number
	height?: number
	radius?: number
	rotation: number
	label?: string
}

interface Hive {
	id: string
	hiveNumber?: number
}

interface Props {
	apiaryId: string
	hives: Hive[]
}

export default function HivePlacement({ apiaryId, hives }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const containerRef = useRef<HTMLDivElement>(null)
	const [canvasWidth, setCanvasWidth] = useState(800)
	const [placements, setPlacements] = useState<Map<string, HivePlacement>>(new Map())
	const [initializedPlacements, setInitializedPlacements] = useState(false)
	const [obstacles, setObstacles] = useState<Obstacle[]>([])
	const [selectedHive, setSelectedHive] = useState<string | null>(null)
	const [selectedObstacle, setSelectedObstacle] = useState<string | null>(null)
	const [isDragging, setIsDragging] = useState(false)
	const [isDraggingRotation, setIsDraggingRotation] = useState(false)
	const [sunAngle, setSunAngle] = useState(90)
	const [autoRotate, setAutoRotate] = useState(false)
	const [addingObstacle, setAddingObstacle] = useState<'CIRCLE' | 'RECTANGLE' | null>(null)

	const { data, loading, error } = useQuery(
		gql`
			query hivePlacements($apiaryId: ID!) {
				hivePlacements(apiaryId: $apiaryId) {
					hiveId
					x
					y
					rotation
				}
				apiaryObstacles(apiaryId: $apiaryId) {
					id
					type
					x
					y
					width
					height
					radius
					rotation
					label
				}
			}
		`,
		{ variables: { apiaryId } }
	)

	const [updatePlacement] = useMutation(gql`
		mutation updateHivePlacement($apiaryId: ID!, $hiveId: ID!, $x: Float!, $y: Float!, $rotation: Float!) {
			updateHivePlacement(apiaryId: $apiaryId, hiveId: $hiveId, x: $x, y: $y, rotation: $rotation) {
				hiveId
			}
		}
	`)

	const [addObstacle] = useMutation(gql`
		mutation addApiaryObstacle($apiaryId: ID!, $obstacle: ApiaryObstacleInput!) {
			addApiaryObstacle(apiaryId: $apiaryId, obstacle: $obstacle) {
				id
			}
		}
	`)

	const [updateObstacle] = useMutation(gql`
		mutation updateApiaryObstacle($id: ID!, $obstacle: ApiaryObstacleInput!) {
			updateApiaryObstacle(id: $id, obstacle: $obstacle) {
				id
			}
		}
	`)

	const [deleteObstacle] = useMutation(gql`
		mutation deleteApiaryObstacle($id: ID!) {
			deleteApiaryObstacle(id: $id)
		}
	`)

	useEffect(() => {
		const updateCanvasWidth = () => {
			if (containerRef.current) {
				const width = containerRef.current.offsetWidth
				setCanvasWidth(Math.max(600, width))
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

		const map = new Map()

		if (data?.hivePlacements) {
			data.hivePlacements.forEach((p: HivePlacement) => {
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

		if (data?.apiaryObstacles) {
			setObstacles(data.apiaryObstacles)
		}
	}, [data, hives.length, initializedPlacements, loading])

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

	useEffect(() => {
		drawCanvas()
	}, [placements, obstacles, sunAngle, selectedHive, selectedObstacle, hives.length, canvasWidth])

	useEffect(() => {
		if (placements.size > 0) {
			drawCanvas()
		}
	}, [placements.size])

	const drawCanvas = () => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		ctx.clearRect(0, 0, canvasWidth, CANVAS_HEIGHT)

		ctx.fillStyle = '#e8f5e9'
		ctx.fillRect(0, 0, canvasWidth, CANVAS_HEIGHT)

		drawCompass(ctx)
		drawSunPosition(ctx)
		drawShadows(ctx)
		drawObstacles(ctx)
		drawHives(ctx)
	}

	const drawCompass = (ctx: CanvasRenderingContext2D) => {
		const x = canvasWidth - 60
		const y = 60
		const radius = 40

		ctx.strokeStyle = '#333'
		ctx.lineWidth = 2
		ctx.beginPath()
		ctx.arc(x, y, radius, 0, Math.PI * 2)
		ctx.stroke()

		ctx.fillStyle = '#e53935'
		ctx.beginPath()
		ctx.moveTo(x, y - radius)
		ctx.lineTo(x - 8, y - radius + 15)
		ctx.lineTo(x + 8, y - radius + 15)
		ctx.closePath()
		ctx.fill()

		ctx.font = 'bold 14px Arial'
		ctx.fillStyle = '#333'
		ctx.textAlign = 'center'
		ctx.fillText('N', x, y - radius - 10)
		ctx.fillText('S', x, y + radius + 20)
		ctx.fillText('E', x + radius + 15, y + 5)
		ctx.fillText('W', x - radius - 15, y + 5)
	}

	const drawSunPosition = (ctx: CanvasRenderingContext2D) => {
		const centerX = canvasWidth / 2
		const centerY = CANVAS_HEIGHT / 2
		const orbitRadius = Math.min(canvasWidth, CANVAS_HEIGHT) / 2 - 80

		const angleRad = (sunAngle - 90) * (Math.PI / 180)
		const sunX = centerX + orbitRadius * Math.cos(angleRad)
		const sunY = centerY + orbitRadius * Math.sin(angleRad)

		const gradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 30)
		gradient.addColorStop(0, '#FFD700')
		gradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
		ctx.fillStyle = gradient
		ctx.beginPath()
		ctx.arc(sunX, sunY, 30, 0, Math.PI * 2)
		ctx.fill()

		ctx.strokeStyle = '#FFA500'
		ctx.lineWidth = 1
		ctx.beginPath()
		ctx.arc(sunX, sunY, 20, 0, Math.PI * 2)
		ctx.stroke()
	}

	const drawShadows = (ctx: CanvasRenderingContext2D) => {
		const angleRad = (sunAngle - 90) * (Math.PI / 180)
		const shadowLength = 100

		ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
		obstacles.forEach((obs) => {
			if (obs.type === 'CIRCLE' && obs.radius) {
				const shadowX = obs.x - shadowLength * Math.cos(angleRad)
				const shadowY = obs.y - shadowLength * Math.sin(angleRad)
				ctx.beginPath()
				ctx.arc(shadowX, shadowY, obs.radius, 0, Math.PI * 2)
				ctx.fill()
			} else if (obs.type === 'RECTANGLE' && obs.width && obs.height) {
				const shadowX = obs.x - shadowLength * Math.cos(angleRad)
				const shadowY = obs.y - shadowLength * Math.sin(angleRad)
				ctx.save()
				ctx.translate(shadowX, shadowY)
				ctx.rotate((obs.rotation || 0) * (Math.PI / 180))
				ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height)
				ctx.restore()
			}
		})
	}

	const drawObstacles = (ctx: CanvasRenderingContext2D) => {
		obstacles.forEach((obs) => {
			const isSelected = obs.id === selectedObstacle
			ctx.strokeStyle = isSelected ? '#2196F3' : '#666'
			ctx.fillStyle = isSelected ? 'rgba(100, 100, 100, 0.4)' : 'rgba(100, 100, 100, 0.3)'
			ctx.lineWidth = isSelected ? 3 : 2

			if (obs.type === 'CIRCLE' && obs.radius) {
				ctx.beginPath()
				ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2)
				ctx.fill()
				ctx.stroke()
			} else if (obs.type === 'RECTANGLE' && obs.width && obs.height) {
				ctx.save()
				ctx.translate(obs.x, obs.y)
				ctx.rotate((obs.rotation || 0) * (Math.PI / 180))
				ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height)
				ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height)
				ctx.restore()
			}

			if (obs.label) {
				ctx.fillStyle = '#333'
				ctx.font = '12px Arial'
				ctx.textAlign = 'center'
				ctx.fillText(obs.label, obs.x, obs.y + 5)
			}
		})
	}

	const drawHives = (ctx: CanvasRenderingContext2D) => {
		hives.forEach((hive) => {
			const placement = placements.get(hive.id)
			if (!placement) return

			const isSelected = hive.id === selectedHive
			ctx.save()
			ctx.translate(placement.x, placement.y)

			if (isSelected) {
				ctx.strokeStyle = '#2196F3'
				ctx.lineWidth = 2
				ctx.setLineDash([5, 5])
				ctx.beginPath()
				ctx.arc(0, 0, HIVE_SIZE / 2 + 10, 0, Math.PI * 2)
				ctx.stroke()
				ctx.setLineDash([])

				const rotHandleDistance = HIVE_SIZE / 2 + 20
				const rotHandleAngle = (placement.rotation || 0) * (Math.PI / 180)
				const rotHandleX = rotHandleDistance * Math.sin(rotHandleAngle)
				const rotHandleY = -rotHandleDistance * Math.cos(rotHandleAngle)

				ctx.fillStyle = '#2196F3'
				ctx.beginPath()
				ctx.arc(rotHandleX, rotHandleY, 6, 0, Math.PI * 2)
				ctx.fill()
				ctx.strokeStyle = '#fff'
				ctx.lineWidth = 2
				ctx.stroke()

				ctx.strokeStyle = '#2196F3'
				ctx.lineWidth = 1
				ctx.beginPath()
				ctx.moveTo(0, 0)
				ctx.lineTo(rotHandleX, rotHandleY)
				ctx.stroke()
			}

			ctx.rotate((placement.rotation || 0) * (Math.PI / 180))

			ctx.fillStyle = isSelected ? '#4CAF50' : '#FFC107'
			ctx.strokeStyle = isSelected ? '#2E7D32' : '#F57C00'
			ctx.lineWidth = isSelected ? 3 : 2
			ctx.fillRect(-HIVE_SIZE / 2, -HIVE_SIZE / 2, HIVE_SIZE, HIVE_SIZE)
			ctx.strokeRect(-HIVE_SIZE / 2, -HIVE_SIZE / 2, HIVE_SIZE, HIVE_SIZE)

			ctx.fillStyle = '#333'
			ctx.fillRect(-4, -HIVE_SIZE / 2, 8, 10)

			ctx.strokeStyle = '#2196F3'
			ctx.lineWidth = 2
			ctx.beginPath()
			ctx.moveTo(0, -HIVE_SIZE / 2)
			ctx.lineTo(0, -HIVE_SIZE / 2 - 15)
			ctx.stroke()

			ctx.fillStyle = '#2196F3'
			ctx.beginPath()
			ctx.moveTo(0, -HIVE_SIZE / 2 - 15)
			ctx.lineTo(-4, -HIVE_SIZE / 2 - 10)
			ctx.lineTo(4, -HIVE_SIZE / 2 - 10)
			ctx.closePath()
			ctx.fill()

			ctx.restore()

			ctx.fillStyle = '#333'
			ctx.font = '11px Arial'
			ctx.textAlign = 'center'
			ctx.fillText(`#${hive.hiveNumber || hive.id}`, placement.x, placement.y + HIVE_SIZE / 2 + 15)
		})
	}

	const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const x = e.clientX - rect.left
		const y = e.clientY - rect.top

		if (addingObstacle) {
			const newObstacle = {
				type: addingObstacle,
				x,
				y,
				width: addingObstacle === 'RECTANGLE' ? 80 : undefined,
				height: addingObstacle === 'RECTANGLE' ? 60 : undefined,
				radius: addingObstacle === 'CIRCLE' ? 40 : undefined,
				rotation: 0,
				label: addingObstacle === 'CIRCLE' ? 'Tree' : 'House',
			}
			addObstacle({ apiaryId, obstacle: newObstacle }).then(() => {
				setObstacles([...obstacles, { ...newObstacle, id: Date.now().toString() }])
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
				isInside = Math.abs(x - obs.x) <= obs.width / 2 && Math.abs(y - obs.y) <= obs.height / 2
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

	const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const x = e.clientX - rect.left
		const y = e.clientY - rect.top

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

		for (const hive of hives) {
			const placement = placements.get(hive.id)
			if (placement) {
				const dist = Math.sqrt((x - placement.x) ** 2 + (y - placement.y) ** 2)
				if (dist <= HIVE_SIZE / 2 + 5) {
					setSelectedHive(hive.id)
					setSelectedObstacle(null)
					setIsDragging(true)
					return
				}
			}
		}
	}

	const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!selectedHive) return

		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const x = e.clientX - rect.left
		const y = e.clientY - rect.top

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
		if ((isDragging || isDraggingRotation) && selectedHive) {
			const placement = placements.get(selectedHive)
			if (placement) {
				updatePlacement({
					apiaryId,
					hiveId: selectedHive,
					x: placement.x,
					y: placement.y,
					rotation: placement.rotation,
				})
			}
		}
		setIsDragging(false)
		setIsDraggingRotation(false)
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
				rotation: newRotation,
			})
		}
	}

	const handleDeleteObstacle = () => {
		if (!selectedObstacle) return
		deleteObstacle({ id: selectedObstacle }).then(() => {
			setObstacles(obstacles.filter((o) => o.id !== selectedObstacle))
			setSelectedObstacle(null)
		})
	}

	if (loading) return <Loader />
	if (error) return <ErrorMsg error={error} />

	return (
		<div ref={containerRef} style={{ width: '100%' }}>
			<div style={{ marginBottom: '20px', padding: '0 20px' }}>
				<h3><T>Hive Placement Planner</T></h3>
				<p><T>Position your hives optimally considering sun movement, shadows, and flight patterns</T></p>
			</div>

			<div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap', padding: '0 20px' }}>
				<Button onClick={() => setAddingObstacle('CIRCLE')} color={addingObstacle === 'CIRCLE' ? 'green' : undefined}>
					<T>Add Tree</T>
				</Button>
				<Button onClick={() => setAddingObstacle('RECTANGLE')} color={addingObstacle === 'RECTANGLE' ? 'green' : undefined}>
					<T>Add Building</T>
				</Button>
				{selectedHive && (
					<>
						<Button onClick={() => rotateHive(-15)}><T>Rotate Left</T></Button>
						<Button onClick={() => rotateHive(15)}><T>Rotate Right</T></Button>
					</>
				)}
				{selectedObstacle && (
					<Button onClick={handleDeleteObstacle} color="red">
						<T>Delete Obstacle</T>
					</Button>
				)}
			</div>

			<div style={{ marginBottom: '20px', padding: '0 20px' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
					<label>
						<T>Sun Position</T>: {sunAngle}° ({sunAngle === 90 ? 'E' : sunAngle === 180 ? 'S' : sunAngle === 270 ? 'W' : ''})
					</label>
					<input
						type="range"
						min="90"
						max="270"
						value={sunAngle}
						onChange={(e) => setSunAngle(parseInt(e.target.value))}
						style={{ width: '300px' }}
					/>
					<label>
						<input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />
						<T>Auto-rotate</T>
					</label>
				</div>
			</div>

			<canvas
				ref={canvasRef}
				width={canvasWidth}
				height={CANVAS_HEIGHT}
				onClick={handleCanvasClick}
				onMouseDown={handleCanvasMouseDown}
				onMouseMove={handleCanvasMouseMove}
				onMouseUp={handleCanvasMouseUp}
				onMouseLeave={handleCanvasMouseUp}
				style={{
					borderTop: '2px solid #ccc',
					borderBottom: '2px solid #ccc',
					cursor: addingObstacle ? 'crosshair' : (isDragging || isDraggingRotation) ? 'grabbing' : 'pointer',
					display: 'block',
					width: '100%',
					height: 'auto'
				}}
			/>

			<div style={{ marginTop: '20px', margin: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
				<h4><T>Tips</T>:</h4>
				<ul>
					<li><T>Click on a hive to select it, then drag to move</T></li>
					<li><T>When hive is selected, drag the blue rotation handle or use buttons to adjust entrance direction</T></li>
					<li><T>Blue arrow shows entrance direction - avoid facing north or other hives</T></li>
					<li><T>Add trees and buildings to visualize shadows throughout the day</T></li>
					<li><T>Sun simulation shows daytime (☀️) and nighttime (🌙) positions</T></li>
					<li><T>Consider flight patterns - hives should not be in line with each other</T></li>
				</ul>
			</div>
		</div>
	)
}

