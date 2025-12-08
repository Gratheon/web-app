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
	const [isDraggingObstacle, setIsDraggingObstacle] = useState(false)
	const [isDraggingObstacleRotation, setIsDraggingObstacleRotation] = useState(false)
	const [isResizingObstacle, setIsResizingObstacle] = useState(false)
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

		drawShadows(ctx)
		drawObstacles(ctx)
		drawHives(ctx)
		drawCompass(ctx)
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

		const angleRad = (sunAngle - 90) * (Math.PI / 180)
		const sunDistance = radius + 15
		const sunX = x + sunDistance * Math.cos(angleRad)
		const sunY = y + sunDistance * Math.sin(angleRad)

		ctx.font = '20px Arial'
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		ctx.fillText('☀️', sunX, sunY)
	}

	const drawSunPosition = (ctx: CanvasRenderingContext2D) => {
	}

	const drawShadows = (ctx: CanvasRenderingContext2D) => {
		const sunAngleRad = (sunAngle - 90) * (Math.PI / 180)
		const sunDirX = Math.cos(sunAngleRad)
		const sunDirY = Math.sin(sunAngleRad)
		const shadowLength = 150

		ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'

		obstacles.forEach((obs) => {
			if (obs.type === 'CIRCLE' && obs.radius) {
				const sunAngleFromCenter = Math.atan2(sunDirY, sunDirX)
				const perpAngle1 = sunAngleFromCenter + Math.PI / 2
				const perpAngle2 = sunAngleFromCenter - Math.PI / 2

				const tangent1 = {
					x: obs.x + Math.cos(perpAngle1) * obs.radius,
					y: obs.y + Math.sin(perpAngle1) * obs.radius
				}
				const tangent2 = {
					x: obs.x + Math.cos(perpAngle2) * obs.radius,
					y: obs.y + Math.sin(perpAngle2) * obs.radius
				}

				const startAngle = perpAngle1
				const endAngle = perpAngle2
				const points = 32
				const silhouettePoints: { x: number; y: number }[] = []

				silhouettePoints.push(tangent1)
				for (let i = 1; i < points; i++) {
					const t = i / points
					const angle = startAngle + (endAngle - startAngle + Math.PI * 2) * t
					silhouettePoints.push({
						x: obs.x + Math.cos(angle) * obs.radius,
						y: obs.y + Math.sin(angle) * obs.radius
					})
				}
				silhouettePoints.push(tangent2)

				ctx.beginPath()
				silhouettePoints.forEach((p, i) => {
					if (i === 0) ctx.moveTo(p.x, p.y)
					else ctx.lineTo(p.x, p.y)
				})

				for (let i = silhouettePoints.length - 1; i >= 0; i--) {
					const p = silhouettePoints[i]
					ctx.lineTo(p.x - sunDirX * shadowLength, p.y - sunDirY * shadowLength)
				}

				ctx.closePath()
				ctx.fill()
			} else if (obs.type === 'RECTANGLE' && obs.width && obs.height) {
				const rotRad = (obs.rotation || 0) * (Math.PI / 180)
				const corners = [
					{ x: -obs.width / 2, y: -obs.height / 2 },
					{ x: obs.width / 2, y: -obs.height / 2 },
					{ x: obs.width / 2, y: obs.height / 2 },
					{ x: -obs.width / 2, y: obs.height / 2 }
				]

				const rotatedCorners = corners.map(c => ({
					x: obs.x + c.x * Math.cos(rotRad) - c.y * Math.sin(rotRad),
					y: obs.y + c.x * Math.sin(rotRad) + c.y * Math.cos(rotRad)
				}))

				const litEdges: number[] = []
				for (let i = 0; i < rotatedCorners.length; i++) {
					const p1 = rotatedCorners[i]
					const p2 = rotatedCorners[(i + 1) % rotatedCorners.length]
					const edgeDx = p2.x - p1.x
					const edgeDy = p2.y - p1.y
					const normalX = -edgeDy
					const normalY = edgeDx
					const dot = normalX * sunDirX + normalY * sunDirY

					if (dot < 0) {
						litEdges.push(i)
					}
				}

				if (litEdges.length >= 2) {
					const silhouettePoints: { x: number; y: number }[] = []

					let minIdx = Math.min(...litEdges)
					let maxIdx = Math.max(...litEdges)

					if (maxIdx - minIdx === litEdges.length - 1) {
						for (let i = minIdx; i <= maxIdx + 1; i++) {
							silhouettePoints.push(rotatedCorners[i % rotatedCorners.length])
						}
					} else {
						for (let i = maxIdx; i < rotatedCorners.length + minIdx + 1; i++) {
							silhouettePoints.push(rotatedCorners[i % rotatedCorners.length])
						}
					}

					ctx.beginPath()
					silhouettePoints.forEach((p, i) => {
						if (i === 0) ctx.moveTo(p.x, p.y)
						else ctx.lineTo(p.x, p.y)
					})

					for (let i = silhouettePoints.length - 1; i >= 0; i--) {
						const p = silhouettePoints[i]
						ctx.lineTo(p.x - sunDirX * shadowLength, p.y - sunDirY * shadowLength)
					}

					ctx.closePath()
					ctx.fill()

					ctx.beginPath()
					const shadowPoints = silhouettePoints.map(p => ({
						x: p.x - sunDirX * shadowLength,
						y: p.y - sunDirY * shadowLength
					}))
					shadowPoints.forEach((p, i) => {
						if (i === 0) ctx.moveTo(p.x, p.y)
						else ctx.lineTo(p.x, p.y)
					})
					ctx.closePath()
					ctx.fill()
				}
			}
		})

		placements.forEach(placement => {
			const rotRad = (placement.rotation || 0) * (Math.PI / 180)
			const corners = [
				{ x: -HIVE_SIZE / 2, y: -HIVE_SIZE / 2 },
				{ x: HIVE_SIZE / 2, y: -HIVE_SIZE / 2 },
				{ x: HIVE_SIZE / 2, y: HIVE_SIZE / 2 },
				{ x: -HIVE_SIZE / 2, y: HIVE_SIZE / 2 }
			]

			const rotatedCorners = corners.map(c => ({
				x: placement.x + c.x * Math.cos(rotRad) - c.y * Math.sin(rotRad),
				y: placement.y + c.x * Math.sin(rotRad) + c.y * Math.cos(rotRad)
			}))

			const litEdges: number[] = []
			for (let i = 0; i < rotatedCorners.length; i++) {
				const p1 = rotatedCorners[i]
				const p2 = rotatedCorners[(i + 1) % rotatedCorners.length]
				const edgeDx = p2.x - p1.x
				const edgeDy = p2.y - p1.y
				const normalX = -edgeDy
				const normalY = edgeDx
				const dot = normalX * sunDirX + normalY * sunDirY

				if (dot < 0) {
					litEdges.push(i)
				}
			}

			if (litEdges.length >= 2) {
				const silhouettePoints: { x: number; y: number }[] = []

				let minIdx = Math.min(...litEdges)
				let maxIdx = Math.max(...litEdges)

				if (maxIdx - minIdx === litEdges.length - 1) {
					for (let i = minIdx; i <= maxIdx + 1; i++) {
						silhouettePoints.push(rotatedCorners[i % rotatedCorners.length])
					}
				} else {
					for (let i = maxIdx; i < rotatedCorners.length + minIdx + 1; i++) {
						silhouettePoints.push(rotatedCorners[i % rotatedCorners.length])
					}
				}

				ctx.beginPath()
				silhouettePoints.forEach((p, i) => {
					if (i === 0) ctx.moveTo(p.x, p.y)
					else ctx.lineTo(p.x, p.y)
				})

				for (let i = silhouettePoints.length - 1; i >= 0; i--) {
					const p = silhouettePoints[i]
					ctx.lineTo(p.x - sunDirX * shadowLength, p.y - sunDirY * shadowLength)
				}

				ctx.closePath()
				ctx.fill()

				ctx.beginPath()
				const shadowPoints = silhouettePoints.map(p => ({
					x: p.x - sunDirX * shadowLength,
					y: p.y - sunDirY * shadowLength
				}))
				shadowPoints.forEach((p, i) => {
					if (i === 0) ctx.moveTo(p.x, p.y)
					else ctx.lineTo(p.x, p.y)
				})
				ctx.closePath()
				ctx.fill()
			}
		})
	}

	const drawObstacles = (ctx: CanvasRenderingContext2D) => {
		obstacles.forEach((obs) => {
			const isSelected = obs.id === selectedObstacle

			ctx.save()
			ctx.translate(obs.x, obs.y)

			if (obs.type === 'CIRCLE' && obs.radius) {
				ctx.strokeStyle = isSelected ? '#2196F3' : '#666'
				ctx.fillStyle = isSelected ? 'rgba(100, 100, 100, 0.4)' : 'rgba(100, 100, 100, 0.3)'
				ctx.lineWidth = isSelected ? 3 : 2
				ctx.beginPath()
				ctx.arc(0, 0, obs.radius, 0, Math.PI * 2)
				ctx.fill()
				ctx.stroke()

				if (isSelected) {
					ctx.fillStyle = '#2196F3'
					ctx.beginPath()
					ctx.arc(obs.radius, 0, 6, 0, Math.PI * 2)
					ctx.fill()
					ctx.strokeStyle = '#fff'
					ctx.lineWidth = 2
					ctx.stroke()
				}
			} else if (obs.type === 'RECTANGLE' && obs.width && obs.height) {
				ctx.rotate((obs.rotation || 0) * (Math.PI / 180))

				ctx.strokeStyle = isSelected ? '#2196F3' : '#666'
				ctx.fillStyle = isSelected ? 'rgba(100, 100, 100, 0.4)' : 'rgba(100, 100, 100, 0.3)'
				ctx.lineWidth = isSelected ? 3 : 2
				ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height)
				ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height)

				if (isSelected) {
					ctx.fillStyle = '#2196F3'
					ctx.beginPath()
					ctx.arc(obs.width / 2, obs.height / 2, 6, 0, Math.PI * 2)
					ctx.fill()
					ctx.strokeStyle = '#fff'
					ctx.lineWidth = 2
					ctx.stroke()

					ctx.rotate(-(obs.rotation || 0) * (Math.PI / 180))
					const rotHandleDistance = Math.sqrt((obs.width / 2) ** 2 + (obs.height / 2) ** 2) + 20
					ctx.fillStyle = '#FF9800'
					ctx.beginPath()
					ctx.arc(rotHandleDistance, 0, 6, 0, Math.PI * 2)
					ctx.fill()
					ctx.strokeStyle = '#fff'
					ctx.lineWidth = 2
					ctx.stroke()
				}
			}

			ctx.restore()
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

		if (selectedObstacle) {
			const obs = obstacles.find(o => o.id === selectedObstacle)
			if (obs) {
				if (obs.type === 'CIRCLE' && obs.radius) {
					const resizeHandleDist = Math.sqrt((x - (obs.x + obs.radius)) ** 2 + (y - obs.y) ** 2)
					if (resizeHandleDist <= 8) {
						setIsResizingObstacle(true)
						return
					}
					const centerDist = Math.sqrt((x - obs.x) ** 2 + (y - obs.y) ** 2)
					if (centerDist <= obs.radius) {
						setIsDraggingObstacle(true)
						return
					}
				} else if (obs.type === 'RECTANGLE' && obs.width && obs.height) {
					const rotHandleDistance = Math.sqrt((obs.width / 2) ** 2 + (obs.height / 2) ** 2) + 20
					const rotHandleDist = Math.sqrt((x - (obs.x + rotHandleDistance)) ** 2 + (y - obs.y) ** 2)
					if (rotHandleDist <= 8) {
						setIsDraggingObstacleRotation(true)
						return
					}

					const rotRad = (obs.rotation || 0) * (Math.PI / 180)
					const resizeHandleX = obs.x + (obs.width / 2 * Math.cos(rotRad) - obs.height / 2 * Math.sin(rotRad))
					const resizeHandleY = obs.y + (obs.width / 2 * Math.sin(rotRad) + obs.height / 2 * Math.cos(rotRad))
					const resizeHandleDist = Math.sqrt((x - resizeHandleX) ** 2 + (y - resizeHandleY) ** 2)
					if (resizeHandleDist <= 8) {
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
		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const x = e.clientX - rect.left
		const y = e.clientY - rect.top

		if (selectedObstacle) {
			const obs = obstacles.find(o => o.id === selectedObstacle)
			if (obs) {
				if (isDraggingObstacle) {
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
		if ((isDraggingObstacle || isResizingObstacle || isDraggingObstacleRotation) && selectedObstacle) {
			const obs = obstacles.find(o => o.id === selectedObstacle)
			if (obs) {
				updateObstacle({
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
					rotation: placement.rotation,
				})
			}
		}
		setIsDragging(false)
		setIsDraggingRotation(false)
		setIsDraggingObstacle(false)
		setIsDraggingObstacleRotation(false)
		setIsResizingObstacle(false)
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
					cursor: addingObstacle ? 'crosshair' :
						(isDragging || isDraggingRotation || isDraggingObstacle) ? 'grabbing' :
						(isResizingObstacle || isDraggingObstacleRotation) ? 'nwse-resize' :
						'pointer',
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
					<li><T>Click obstacles to select, drag to move, resize, or rotate them</T></li>
					<li><T>Blue handle on obstacles = resize, Orange handle = rotate (rectangles only)</T></li>
					<li><T>Sun moves around compass (top right) from East → South → West</T></li>
					<li><T>Realistic polygonal shadows help visualize sun impact throughout the day</T></li>
					<li><T>Consider flight patterns - hives should not be in line with each other</T></li>
				</ul>
			</div>
		</div>
	)
}

