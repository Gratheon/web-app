import React, { useState, useEffect, useRef } from 'react'
import { gql, useMutation, useQuery } from '../../../api'
import Loader from '../../../shared/loader'
import ErrorMsg from '../../../shared/messageError'
import Button from '../../../shared/button'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const HIVE_SIZE = 40
const ARROW_SIZE = 15

type HivePlacement = {
	id: string
	hiveId: string
	x: number
	y: number
	rotation: number
}

type Obstacle = {
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

type Hive = {
	id: string
	hiveNumber?: number
	family?: {
		name?: string
	}
}

type Props = {
	apiaryId: string
	hives: Hive[]
}

export default function HivePlacementTab({ apiaryId, hives }: Props) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [sunAngle, setSunAngle] = useState(0)
	const [autoPlaySun, setAutoPlaySun] = useState(true)
	const [selectedHive, setSelectedHive] = useState<string | null>(null)
	const [selectedObstacle, setSelectedObstacle] = useState<string | null>(null)
	const [dragging, setDragging] = useState(false)
	const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
	const [placements, setPlacements] = useState<HivePlacement[]>([])
	const [obstacles, setObstacles] = useState<Obstacle[]>([])

	const { loading: loadingPlacements, error: errorPlacements, data: placementsData } = useQuery(
		gql`
			query hivePlacements($apiaryId: ID!) {
				hivePlacements(apiaryId: $apiaryId) {
					id
					hiveId
					x
					y
					rotation
				}
			}
		`,
		{ variables: { apiaryId } }
	)

	const { loading: loadingObstacles, error: errorObstacles, data: obstaclesData } = useQuery(
		gql`
			query apiaryObstacles($apiaryId: ID!) {
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

	const [updateHivePlacement] = useMutation(gql`
		mutation updateHivePlacement($apiaryId: ID!, $hiveId: ID!, $x: Float!, $y: Float!, $rotation: Float!) {
			updateHivePlacement(apiaryId: $apiaryId, hiveId: $hiveId, x: $x, y: $y, rotation: $rotation) {
				id
				hiveId
				x
				y
				rotation
			}
		}
	`)

	const [addObstacle] = useMutation(gql`
		mutation addApiaryObstacle($apiaryId: ID!, $obstacle: ApiaryObstacleInput!) {
			addApiaryObstacle(apiaryId: $apiaryId, obstacle: $obstacle) {
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
	`)

	const [deleteObstacle] = useMutation(gql`
		mutation deleteApiaryObstacle($id: ID!) {
			deleteApiaryObstacle(id: $id)
		}
	`)

	useEffect(() => {
		if (placementsData?.hivePlacements) {
			setPlacements(placementsData.hivePlacements)
		}
	}, [placementsData])

	useEffect(() => {
		if (obstaclesData?.apiaryObstacles) {
			setObstacles(obstaclesData.apiaryObstacles)
		}
	}, [obstaclesData])

	useEffect(() => {
		if (placements.length === 0 && hives.length > 0) {
			const randomPlacements = hives.map((hive, index) => ({
				id: '',
				hiveId: hive.id,
				x: 100 + (index % 5) * 100,
				y: 100 + Math.floor(index / 5) * 100,
				rotation: 180
			}))
			setPlacements(randomPlacements)
		}
	}, [hives, placements])

	useEffect(() => {
		let interval: NodeJS.Timeout
		if (autoPlaySun) {
			interval = setInterval(() => {
				setSunAngle(prev => (prev + 1) % 360)
			}, 100)
		}
		return () => clearInterval(interval)
	}, [autoPlaySun])

	useEffect(() => {
		drawCanvas()
	}, [sunAngle, placements, obstacles, selectedHive, selectedObstacle])

	const drawCanvas = () => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

		ctx.fillStyle = '#e8f5e9'
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

		drawCompass(ctx)
		drawSunAndShadows(ctx)
		drawObstacles(ctx)
		drawHives(ctx)
	}

	const drawCompass = (ctx: CanvasRenderingContext2D) => {
		const cx = CANVAS_WIDTH - 50
		const cy = 50
		const radius = 30

		ctx.save()
		ctx.strokeStyle = '#333'
		ctx.lineWidth = 2
		ctx.beginPath()
		ctx.arc(cx, cy, radius, 0, 2 * Math.PI)
		ctx.stroke()

		ctx.fillStyle = '#f44336'
		ctx.beginPath()
		ctx.moveTo(cx, cy)
		ctx.lineTo(cx - 5, cy - radius + 5)
		ctx.lineTo(cx, cy - radius - 5)
		ctx.lineTo(cx + 5, cy - radius + 5)
		ctx.closePath()
		ctx.fill()

		ctx.font = '14px Arial'
		ctx.fillStyle = '#333'
		ctx.textAlign = 'center'
		ctx.fillText('N', cx, cy - radius - 10)
		ctx.fillText('S', cx, cy + radius + 20)
		ctx.fillText('E', cx + radius + 15, cy + 5)
		ctx.fillText('W', cx - radius - 15, cy + 5)

		ctx.restore()
	}

	const drawSunAndShadows = (ctx: CanvasRenderingContext2D) => {
		const sunRadius = 25
		const sunDistance = 100
		const sunX = CANVAS_WIDTH / 2 + Math.cos((sunAngle - 90) * Math.PI / 180) * sunDistance
		const sunY = 50 + Math.sin((sunAngle - 90) * Math.PI / 180) * sunDistance * 0.5

		ctx.save()
		ctx.fillStyle = '#FDB813'
		ctx.beginPath()
		ctx.arc(sunX, sunY, sunRadius, 0, 2 * Math.PI)
		ctx.fill()

		for (let i = 0; i < 12; i++) {
			const angle = (i * 30) * Math.PI / 180
			const x1 = sunX + Math.cos(angle) * (sunRadius + 5)
			const y1 = sunY + Math.sin(angle) * (sunRadius + 5)
			const x2 = sunX + Math.cos(angle) * (sunRadius + 12)
			const y2 = sunY + Math.sin(angle) * (sunRadius + 12)
			ctx.strokeStyle = '#FDB813'
			ctx.lineWidth = 2
			ctx.beginPath()
			ctx.moveTo(x1, y1)
			ctx.lineTo(x2, y2)
			ctx.stroke()
		}
		ctx.restore()

		obstacles.forEach(obstacle => {
			drawShadow(ctx, obstacle, sunAngle)
		})

		placements.forEach(placement => {
			drawHiveShadow(ctx, placement, sunAngle)
		})
	}

	const drawShadow = (ctx: CanvasRenderingContext2D, obstacle: Obstacle, angle: number) => {
		const shadowLength = 80
		const shadowAngle = (angle + 180) * Math.PI / 180

		ctx.save()
		ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'

		if (obstacle.type === 'CIRCLE' && obstacle.radius) {
			const shadowX = obstacle.x + Math.cos(shadowAngle) * shadowLength
			const shadowY = obstacle.y + Math.sin(shadowAngle) * shadowLength

			ctx.beginPath()
			ctx.ellipse(shadowX, shadowY, obstacle.radius * 1.5, obstacle.radius * 0.5, shadowAngle, 0, 2 * Math.PI)
			ctx.fill()
		} else if (obstacle.type === 'RECTANGLE' && obstacle.width && obstacle.height) {
			const shadowX = obstacle.x + Math.cos(shadowAngle) * shadowLength
			const shadowY = obstacle.y + Math.sin(shadowAngle) * shadowLength

			ctx.translate(shadowX, shadowY)
			ctx.rotate(obstacle.rotation * Math.PI / 180)
			ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height)
		}

		ctx.restore()
	}

	const drawHiveShadow = (ctx: CanvasRenderingContext2D, placement: HivePlacement, angle: number) => {
		const shadowLength = 40
		const shadowAngle = (angle + 180) * Math.PI / 180
		const shadowX = placement.x + Math.cos(shadowAngle) * shadowLength
		const shadowY = placement.y + Math.sin(shadowAngle) * shadowLength

		ctx.save()
		ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
		ctx.fillRect(shadowX - HIVE_SIZE / 2, shadowY - HIVE_SIZE / 2, HIVE_SIZE, HIVE_SIZE)
		ctx.restore()
	}

	const drawObstacles = (ctx: CanvasRenderingContext2D) => {
		obstacles.forEach(obstacle => {
			ctx.save()

			const isSelected = selectedObstacle === obstacle.id
			if (isSelected) {
				ctx.strokeStyle = '#2196F3'
				ctx.lineWidth = 3
			} else {
				ctx.strokeStyle = '#8B4513'
				ctx.lineWidth = 2
			}

			if (obstacle.type === 'CIRCLE' && obstacle.radius) {
				ctx.fillStyle = '#6D4C41'
				ctx.beginPath()
				ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, 2 * Math.PI)
				ctx.fill()
				ctx.stroke()
			} else if (obstacle.type === 'RECTANGLE' && obstacle.width && obstacle.height) {
				ctx.fillStyle = '#8B4513'
				ctx.translate(obstacle.x, obstacle.y)
				ctx.rotate(obstacle.rotation * Math.PI / 180)
				ctx.fillRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height)
				ctx.strokeRect(-obstacle.width / 2, -obstacle.height / 2, obstacle.width, obstacle.height)
			}

			if (obstacle.label) {
				ctx.font = '12px Arial'
				ctx.fillStyle = '#000'
				ctx.textAlign = 'center'
				ctx.fillText(obstacle.label, 0, 5)
			}

			ctx.restore()
		})
	}

	const drawHives = (ctx: CanvasRenderingContext2D) => {
		placements.forEach(placement => {
			const hive = hives.find(h => h.id === placement.hiveId)
			if (!hive) return

			ctx.save()
			ctx.translate(placement.x, placement.y)

			const isSelected = selectedHive === placement.hiveId
			if (isSelected) {
				ctx.strokeStyle = '#2196F3'
				ctx.lineWidth = 3
			} else {
				ctx.strokeStyle = '#FFC107'
				ctx.lineWidth = 2
			}

			ctx.fillStyle = '#FFC107'
			ctx.fillRect(-HIVE_SIZE / 2, -HIVE_SIZE / 2, HIVE_SIZE, HIVE_SIZE)
			ctx.strokeRect(-HIVE_SIZE / 2, -HIVE_SIZE / 2, HIVE_SIZE, HIVE_SIZE)

			ctx.rotate(placement.rotation * Math.PI / 180)
			ctx.fillStyle = '#000'
			ctx.beginPath()
			ctx.moveTo(0, -ARROW_SIZE)
			ctx.lineTo(ARROW_SIZE / 2, 0)
			ctx.lineTo(-ARROW_SIZE / 2, 0)
			ctx.closePath()
			ctx.fill()

			ctx.rotate(-placement.rotation * Math.PI / 180)

			ctx.font = '12px Arial'
			ctx.fillStyle = '#000'
			ctx.textAlign = 'center'
			const label = hive.family?.name || `#${hive.hiveNumber || hive.id}`
			ctx.fillText(label, 0, HIVE_SIZE / 2 + 15)

			ctx.restore()
		})
	}

	const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const x = e.clientX - rect.left
		const y = e.clientY - rect.top

		let clickedHive = false
		placements.forEach(placement => {
			const dx = x - placement.x
			const dy = y - placement.y
			if (Math.abs(dx) < HIVE_SIZE / 2 && Math.abs(dy) < HIVE_SIZE / 2) {
				setSelectedHive(placement.hiveId)
				setSelectedObstacle(null)
				clickedHive = true
			}
		})

		if (!clickedHive) {
			obstacles.forEach(obstacle => {
				let clicked = false
				if (obstacle.type === 'CIRCLE' && obstacle.radius) {
					const dx = x - obstacle.x
					const dy = y - obstacle.y
					if (Math.sqrt(dx * dx + dy * dy) < obstacle.radius) {
						clicked = true
					}
				} else if (obstacle.type === 'RECTANGLE' && obstacle.width && obstacle.height) {
					const dx = x - obstacle.x
					const dy = y - obstacle.y
					if (Math.abs(dx) < obstacle.width / 2 && Math.abs(dy) < obstacle.height / 2) {
						clicked = true
					}
				}
				if (clicked) {
					setSelectedObstacle(obstacle.id)
					setSelectedHive(null)
				}
			})
		}
	}

	const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const x = e.clientX - rect.left
		const y = e.clientY - rect.top

		placements.forEach(placement => {
			const dx = x - placement.x
			const dy = y - placement.y
			if (Math.abs(dx) < HIVE_SIZE / 2 && Math.abs(dy) < HIVE_SIZE / 2) {
				setDragging(true)
				setDragOffset({ x: dx, y: dy })
				setSelectedHive(placement.hiveId)
			}
		})
	}

	const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		if (!dragging || !selectedHive) return

		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const x = e.clientX - rect.left - dragOffset.x
		const y = e.clientY - rect.top - dragOffset.y

		setPlacements(prev =>
			prev.map(p =>
				p.hiveId === selectedHive
					? { ...p, x: Math.max(HIVE_SIZE / 2, Math.min(CANVAS_WIDTH - HIVE_SIZE / 2, x)), y: Math.max(HIVE_SIZE / 2, Math.min(CANVAS_HEIGHT - HIVE_SIZE / 2, y)) }
					: p
			)
		)
	}

	const handleCanvasMouseUp = async () => {
		if (dragging && selectedHive) {
			const placement = placements.find(p => p.hiveId === selectedHive)
			if (placement) {
				await updateHivePlacement({
					apiaryId,
					hiveId: selectedHive,
					x: placement.x,
					y: placement.y,
					rotation: placement.rotation
				})
			}
		}
		setDragging(false)
	}

	const handleRotateHive = (direction: 'left' | 'right') => {
		if (!selectedHive) return

		setPlacements(prev =>
			prev.map(p =>
				p.hiveId === selectedHive
					? { ...p, rotation: (p.rotation + (direction === 'left' ? -45 : 45) + 360) % 360 }
					: p
			)
		)

		const placement = placements.find(p => p.hiveId === selectedHive)
		if (placement) {
			const newRotation = (placement.rotation + (direction === 'left' ? -45 : 45) + 360) % 360
			updateHivePlacement({
				apiaryId,
				hiveId: selectedHive,
				x: placement.x,
				y: placement.y,
				rotation: newRotation
			})
		}
	}

	const handleAddObstacle = async (type: 'CIRCLE' | 'RECTANGLE') => {
		const newObstacle = {
			type,
			x: CANVAS_WIDTH / 2,
			y: CANVAS_HEIGHT / 2,
			width: type === 'RECTANGLE' ? 100 : undefined,
			height: type === 'RECTANGLE' ? 80 : undefined,
			radius: type === 'CIRCLE' ? 50 : undefined,
			rotation: 0,
			label: type === 'RECTANGLE' ? 'Building' : 'Tree'
		}

		const result = await addObstacle({
			apiaryId,
			obstacle: newObstacle
		})

		if (result.data?.addApiaryObstacle) {
			setObstacles([...obstacles, result.data.addApiaryObstacle])
		}
	}

	const handleDeleteObstacle = async () => {
		if (!selectedObstacle) return

		await deleteObstacle({ id: selectedObstacle })
		setObstacles(obstacles.filter(o => o.id !== selectedObstacle))
		setSelectedObstacle(null)
	}

	if (loadingPlacements || loadingObstacles) return <Loader />

	return (
		<div style={{ padding: '20px' }}>
			<ErrorMsg error={errorPlacements || errorObstacles} />

			<div style={{ marginBottom: '20px' }}>
				<h3>Hive Placement Planner</h3>
				<p>Position your hives optimally considering sun movement, shadows from obstacles, and flight patterns. Avoid placing hive entrances facing north or towards walls.</p>
			</div>

			<div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
				<label>Sun Position: {Math.round(sunAngle)}°</label>
				<input
					type="range"
					min="0"
					max="360"
					value={sunAngle}
					onChange={e => setSunAngle(+(e.target as HTMLInputElement).value)}
					style={{ width: '200px' }}
				/>
				<Button onClick={() => setAutoPlaySun(!autoPlaySun)}>
					{autoPlaySun ? 'Pause' : 'Play'} Sun
				</Button>
			</div>

			<canvas
				ref={canvasRef}
				width={CANVAS_WIDTH}
				height={CANVAS_HEIGHT}
				onClick={handleCanvasClick}
				onMouseDown={handleCanvasMouseDown}
				onMouseMove={handleCanvasMouseMove}
				onMouseUp={handleCanvasMouseUp}
				onMouseLeave={handleCanvasMouseUp}
				style={{ border: '2px solid #ccc', borderRadius: '4px', cursor: dragging ? 'grabbing' : 'pointer' }}
			/>

			<div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
				<Button onClick={() => handleAddObstacle('RECTANGLE')}>Add Building</Button>
				<Button onClick={() => handleAddObstacle('CIRCLE')}>Add Tree</Button>
				{selectedObstacle && (
					<Button color="red" onClick={handleDeleteObstacle}>Delete Obstacle</Button>
				)}
				{selectedHive && (
					<>
						<Button onClick={() => handleRotateHive('left')}>Rotate Left ↺</Button>
						<Button onClick={() => handleRotateHive('right')}>Rotate Right ↻</Button>
					</>
				)}
			</div>

			{selectedHive && (
				<div style={{ marginTop: '20px', padding: '10px', background: '#e3f2fd', borderRadius: '4px' }}>
					<strong>Selected Hive:</strong> {hives.find(h => h.id === selectedHive)?.family?.name || `#${hives.find(h => h.id === selectedHive)?.hiveNumber}`}
					<br />
					<small>Drag to move, use rotate buttons to change entrance direction</small>
				</div>
			)}
		</div>
	)
}

