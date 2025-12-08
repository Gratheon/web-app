import React, { useRef, useEffect, useState } from 'react'
import { Obstacle, HivePlacement, Hive, HIVE_SIZE, CANVAS_HEIGHT } from './types'
import { calculateShadow } from './ShadowRenderer'

interface CanvasProps {
	canvasWidth: number
	placements: Map<string, HivePlacement>
	obstacles: Obstacle[]
	hives: Hive[]
	sunAngle: number
	autoRotate: boolean
	selectedHive: string | null
	selectedObstacle: string | null
	addingObstacle: 'CIRCLE' | 'RECTANGLE' | null
	isDragging: boolean
	isDraggingRotation: boolean
	isDraggingObstacle: boolean
	isResizingObstacle: boolean
	isDraggingObstacleRotation: boolean
	isDraggingHeight: boolean
	isPanning: boolean
	panOffset: { x: number; y: number }
	isMobile?: boolean
	onClick: (x: number, y: number) => void
	onMouseDown: (x: number, y: number, e?: any) => void
	onMouseMove: (x: number, y: number) => void
	onMouseUp: () => void
	onSunAngleChange: (angle: number) => void
	onAutoRotateToggle: () => void
}

export default function Canvas({
	canvasWidth,
	placements,
	obstacles,
	hives,
	sunAngle,
	autoRotate,
	selectedHive,
	selectedObstacle,
	addingObstacle,
	isDragging,
	isDraggingRotation,
	isDraggingObstacle,
	isResizingObstacle,
	isDraggingObstacleRotation,
	isDraggingHeight,
	isPanning,
	panOffset,
	isMobile = false,
	onClick,
	onMouseDown,
	onMouseMove,
	onMouseUp,
	onSunAngleChange,
	onAutoRotateToggle
}: CanvasProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const handleSize = isMobile ? 12 : 8
	const [isDraggingSun, setIsDraggingSun] = useState(false)

	useEffect(() => {
		drawCanvas()
	}, [placements, obstacles, sunAngle, selectedHive, selectedObstacle, hives.length, canvasWidth, panOffset])

	const drawCanvas = () => {
		const canvas = canvasRef.current
		if (!canvas) return

		const ctx = canvas.getContext('2d')
		if (!ctx) return

		ctx.clearRect(0, 0, canvasWidth, CANVAS_HEIGHT)

		ctx.fillStyle = '#e8f5e9'
		ctx.fillRect(0, 0, canvasWidth, CANVAS_HEIGHT)

		ctx.save()
		ctx.translate(panOffset.x, panOffset.y)

		calculateShadow(ctx, obstacles, placements, hives, sunAngle)
		drawObstacles(ctx)
		drawHives(ctx)

		ctx.restore()

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

		if (autoRotate) {
			ctx.strokeStyle = 'rgba(255, 193, 7, 0.5)'
			ctx.lineWidth = 2
			ctx.setLineDash([4, 4])
			ctx.beginPath()
			ctx.arc(x, y, sunDistance, 0, Math.PI * 2)
			ctx.stroke()
			ctx.setLineDash([])
		}

		ctx.font = '24px Arial'
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		ctx.fillText('☀️', sunX, sunY)
	}

	const drawObstacles = (ctx: CanvasRenderingContext2D) => {
		obstacles.forEach(obs => {
			const isSelected = obs.id === selectedObstacle

			if (obs.type === 'CIRCLE' && obs.radius) {
				ctx.fillStyle = isSelected ? 'rgba(76, 175, 80, 0.5)' : 'rgba(76, 175, 80, 0.3)'
				ctx.strokeStyle = isSelected ? '#43a047' : '#66bb6a'
				ctx.lineWidth = isSelected ? 3 : 2
				ctx.beginPath()
				ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2)
				ctx.fill()
				ctx.stroke()

				if (isSelected) {
					ctx.fillStyle = '#2196F3'
					ctx.beginPath()
					ctx.arc(obs.x + obs.radius, obs.y, handleSize, 0, Math.PI * 2)
					ctx.fill()

					const heightHandleY = obs.y + obs.radius + 30
					ctx.fillStyle = '#4CAF50'
					ctx.beginPath()
					ctx.arc(obs.x, heightHandleY, handleSize, 0, Math.PI * 2)
					ctx.fill()

					ctx.strokeStyle = '#4CAF50'
					ctx.lineWidth = 1
					ctx.setLineDash([2, 2])
					ctx.beginPath()
					ctx.moveTo(obs.x, obs.y + obs.radius)
					ctx.lineTo(obs.x, heightHandleY)
					ctx.stroke()
					ctx.setLineDash([])
				}
			} else if (obs.type === 'RECTANGLE' && obs.width && obs.height) {
				ctx.save()
				ctx.translate(obs.x, obs.y)
				ctx.rotate((obs.rotation || 0) * Math.PI / 180)

				ctx.fillStyle = isSelected ? 'rgba(158, 158, 158, 0.5)' : 'rgba(158, 158, 158, 0.3)'
				ctx.strokeStyle = isSelected ? '#757575' : '#9e9e9e'
				ctx.lineWidth = isSelected ? 3 : 2
				ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height)
				ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height)

				ctx.restore()

				if (isSelected) {
					const rotRad = (obs.rotation || 0) * (Math.PI / 180)
					const resizeHandleX = obs.x + (obs.width / 2 * Math.cos(rotRad) - obs.height / 2 * Math.sin(rotRad))
					const resizeHandleY = obs.y + (obs.width / 2 * Math.sin(rotRad) + obs.height / 2 * Math.cos(rotRad))

					ctx.fillStyle = '#2196F3'
					ctx.beginPath()
					ctx.arc(resizeHandleX, resizeHandleY, handleSize, 0, Math.PI * 2)
					ctx.fill()

					const rotHandleDistance = Math.sqrt((obs.width / 2) ** 2 + (obs.height / 2) ** 2) + 20
					ctx.fillStyle = '#FF9800'
					ctx.beginPath()
					ctx.arc(obs.x + rotHandleDistance, obs.y, handleSize, 0, Math.PI * 2)
					ctx.fill()

					const heightHandleDistance = Math.sqrt((obs.width / 2) ** 2 + (obs.height / 2) ** 2) + 40
					ctx.fillStyle = '#4CAF50'
					ctx.beginPath()
					ctx.arc(obs.x, obs.y + heightHandleDistance, handleSize, 0, Math.PI * 2)
					ctx.fill()

					ctx.strokeStyle = '#4CAF50'
					ctx.lineWidth = 1
					ctx.setLineDash([2, 2])
					ctx.beginPath()
					ctx.moveTo(obs.x, obs.y)
					ctx.lineTo(obs.x, obs.y + heightHandleDistance)
					ctx.stroke()
					ctx.setLineDash([])
				}
			}

			if (obs.label) {
				ctx.font = '12px Arial'
				ctx.fillStyle = '#333'
				ctx.textAlign = 'center'
				ctx.fillText(obs.label, obs.x, obs.y)
			}
		})
	}

	const drawHives = (ctx: CanvasRenderingContext2D) => {
		placements.forEach((placement) => {
			const hive = hives.find(h => h.id === placement.hiveId)
			const isSelected = placement.hiveId === selectedHive

			ctx.save()
			ctx.translate(placement.x, placement.y)
			ctx.rotate((placement.rotation || 0) * Math.PI / 180)

			if (isSelected && isMobile) {
				ctx.shadowColor = 'rgba(255, 160, 0, 0.6)'
				ctx.shadowBlur = 15
				ctx.shadowOffsetX = 0
				ctx.shadowOffsetY = 0
			}

			ctx.fillStyle = isSelected ? '#FFD54F' : '#FFF9C4'
			ctx.strokeStyle = isSelected ? '#FFA000' : '#FBC02D'
			ctx.lineWidth = isSelected ? (isMobile ? 4 : 3) : 2
			ctx.fillRect(-HIVE_SIZE / 2, -HIVE_SIZE / 2, HIVE_SIZE, HIVE_SIZE)
			ctx.strokeRect(-HIVE_SIZE / 2, -HIVE_SIZE / 2, HIVE_SIZE, HIVE_SIZE)

			if (isSelected && isMobile) {
				ctx.shadowColor = 'transparent'
				ctx.shadowBlur = 0
			}

			const flightLineLength = 60
			ctx.strokeStyle = isSelected ? '#2196F3' : '#1976D2'
			ctx.lineWidth = 2
			ctx.setLineDash([4, 4])
			ctx.beginPath()
			ctx.moveTo(0, -HIVE_SIZE / 2)
			ctx.lineTo(0, -HIVE_SIZE / 2 - flightLineLength)
			ctx.stroke()
			ctx.setLineDash([])

			ctx.fillStyle = isSelected ? '#2196F3' : '#1976D2'
			ctx.beginPath()
			ctx.moveTo(0, -HIVE_SIZE / 2 - flightLineLength)
			ctx.lineTo(-6, -HIVE_SIZE / 2 - flightLineLength + 12)
			ctx.lineTo(6, -HIVE_SIZE / 2 - flightLineLength + 12)
			ctx.closePath()
			ctx.fill()

			ctx.restore()

			if (isSelected) {
				const rotHandleDistance = HIVE_SIZE / 2 + 20
				const rotHandleAngle = (placement.rotation || 0) * (Math.PI / 180)
				const rotHandleX = placement.x + rotHandleDistance * Math.sin(rotHandleAngle)
				const rotHandleY = placement.y - rotHandleDistance * Math.cos(rotHandleAngle)

				ctx.fillStyle = '#2196F3'
				ctx.beginPath()
				ctx.arc(rotHandleX, rotHandleY, handleSize, 0, Math.PI * 2)
				ctx.fill()
			}

			if (hive?.hiveNumber) {
				ctx.font = 'bold 12px Arial'
				ctx.fillStyle = '#333'
				ctx.textAlign = 'center'
				ctx.textBaseline = 'middle'
				ctx.fillText(`#${hive.hiveNumber}`, placement.x, placement.y)
			}
		})
	}

	const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const xRaw = e.clientX - rect.left
		const yRaw = e.clientY - rect.top

		const compassX = canvasWidth - 60
		const compassY = 60
		const radius = 40
		const angleRad = (sunAngle - 90) * (Math.PI / 180)
		const sunDistance = radius + 15
		const sunX = compassX + sunDistance * Math.cos(angleRad)
		const sunY = compassY + sunDistance * Math.sin(angleRad)

		const distToSun = Math.sqrt((xRaw - sunX) ** 2 + (yRaw - sunY) ** 2)
		if (distToSun <= 15) {
			onAutoRotateToggle()
			return
		}

		const x = xRaw - panOffset.x
		const y = yRaw - panOffset.y

		onClick(x, y)
	}

	const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const xRaw = e.clientX - rect.left
		const yRaw = e.clientY - rect.top

		const compassX = canvasWidth - 60
		const compassY = 60
		const radius = 40
		const angleRad = (sunAngle - 90) * (Math.PI / 180)
		const sunDistance = radius + 15
		const sunX = compassX + sunDistance * Math.cos(angleRad)
		const sunY = compassY + sunDistance * Math.sin(angleRad)

		const distToSun = Math.sqrt((xRaw - sunX) ** 2 + (yRaw - sunY) ** 2)
		if (distToSun <= 15) {
			setIsDraggingSun(true)
			return
		}

		const x = xRaw - panOffset.x
		const y = yRaw - panOffset.y

		onMouseDown(x, y, e)
	}

	const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const xRaw = e.clientX - rect.left
		const yRaw = e.clientY - rect.top

		if (isDraggingSun) {
			const compassX = canvasWidth - 60
			const compassY = 60
			const dx = xRaw - compassX
			const dy = yRaw - compassY
			const angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90
			const normalizedAngle = ((angle % 360) + 360) % 360
			const clampedAngle = Math.max(90, Math.min(270, normalizedAngle))
			onSunAngleChange(clampedAngle)
			return
		}

		const x = isPanning ? xRaw : xRaw - panOffset.x
		const y = isPanning ? yRaw : yRaw - panOffset.y

		onMouseMove(x, y)
	}

	const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
		e.preventDefault()
		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const touch = e.touches[0]
		const x = touch.clientX - rect.left - panOffset.x
		const y = touch.clientY - rect.top - panOffset.y

		onMouseDown(x, y, e)
	}

	const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
		e.preventDefault()
		const canvas = canvasRef.current
		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const touch = e.touches[0]
		const x = isPanning ? touch.clientX - rect.left : touch.clientX - rect.left - panOffset.x
		const y = isPanning ? touch.clientY - rect.top : touch.clientY - rect.top - panOffset.y

		onMouseMove(x, y)
	}

	const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
		e.preventDefault()
		setIsDraggingSun(false)
		onMouseUp()
	}

	const handleMouseUp = () => {
		setIsDraggingSun(false)
		onMouseUp()
	}

	return (
		<canvas
			ref={canvasRef}
			width={canvasWidth}
			height={CANVAS_HEIGHT}
			onClick={handleCanvasClick}
			onMouseDown={handleCanvasMouseDown}
			onMouseMove={handleCanvasMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseUp}
			onContextMenu={(e) => e.preventDefault()}
			onTouchStart={handleTouchStart}
			onTouchMove={handleTouchMove}
			onTouchEnd={handleTouchEnd}
			onTouchCancel={handleTouchEnd}
			style={{
				borderTop: '2px solid #ccc',
				borderBottom: '2px solid #ccc',
				cursor: isDraggingSun ? 'grabbing' :
					isPanning ? 'move' :
					addingObstacle ? 'crosshair' :
					(isDragging || isDraggingRotation || isDraggingObstacle) ? 'grabbing' :
					(isResizingObstacle || isDraggingObstacleRotation) ? 'nwse-resize' :
					isDraggingHeight ? 'ns-resize' :
					'pointer',
				display: 'block',
				width: '100%',
				height: 'auto',
				touchAction: 'none'
			}}
		/>
	)
}

