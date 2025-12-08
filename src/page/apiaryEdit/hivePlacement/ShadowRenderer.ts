import { Obstacle, HivePlacement, Hive, HIVE_SIZE } from './types'

const DEFAULT_OBSTACLE_HEIGHT = 150

export const calculateShadow = (
	ctx: CanvasRenderingContext2D,
	obstacles: Obstacle[],
	placements: Map<string, HivePlacement>,
	hives: Hive[],
	sunAngle: number
) => {
	const sunAngleRad = (sunAngle - 90) * (Math.PI / 180)
	const sunDirX = Math.cos(sunAngleRad)
	const sunDirY = Math.sin(sunAngleRad)

	ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'

	obstacles.forEach((obs) => {
		const obstacleHeight = obs.objectHeight ?? DEFAULT_OBSTACLE_HEIGHT
		const shadowLength = obstacleHeight * 1.5

		if (obs.type === 'CIRCLE' && obs.radius) {
			drawCircleShadow(ctx, obs, sunDirX, sunDirY, shadowLength, sunAngleRad)
		} else if (obs.type === 'RECTANGLE' && obs.width && obs.height) {
			drawRectangleShadow(ctx, obs, sunDirX, sunDirY, shadowLength)
		}
	})

	placements.forEach(placement => {
		const hive = hives.find(h => h.id === placement.hiveId)
		const boxCount = hive?.boxCount || 2
		const hiveHeight = boxCount * 15
		const shadowLength = hiveHeight * 1.5
		drawHiveShadow(ctx, placement, sunDirX, sunDirY, shadowLength)
	})
}

const drawCircleShadow = (
	ctx: CanvasRenderingContext2D,
	obs: Obstacle,
	sunDirX: number,
	sunDirY: number,
	shadowLength: number,
	sunAngleFromCenter: number
) => {
	if (!obs.radius) return

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

	ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
	ctx.beginPath()

	silhouettePoints.forEach((p, i) => {
		if (i === 0) {
			ctx.moveTo(p.x, p.y)
		} else {
			ctx.lineTo(p.x, p.y)
		}
	})

	for (let i = silhouettePoints.length - 1; i >= 0; i--) {
		const p = silhouettePoints[i]
		const shadowX = p.x - sunDirX * shadowLength
		const shadowY = p.y - sunDirY * shadowLength
		ctx.lineTo(shadowX, shadowY)
	}

	ctx.closePath()
	ctx.fill()
}

const drawRectangleShadow = (
	ctx: CanvasRenderingContext2D,
	obs: Obstacle,
	sunDirX: number,
	sunDirY: number,
	shadowLength: number
) => {
	if (!obs.width || !obs.height) return

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

		if (dot > 0) {
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

		ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
		ctx.beginPath()

		silhouettePoints.forEach((p, i) => {
			if (i === 0) {
				ctx.moveTo(p.x, p.y)
			} else {
				ctx.lineTo(p.x, p.y)
			}
		})

		for (let i = silhouettePoints.length - 1; i >= 0; i--) {
			const p = silhouettePoints[i]
			const shadowX = p.x - sunDirX * shadowLength
			const shadowY = p.y - sunDirY * shadowLength
			ctx.lineTo(shadowX, shadowY)
		}

		ctx.closePath()
		ctx.fill()
	}
}

const drawHiveShadow = (
	ctx: CanvasRenderingContext2D,
	placement: HivePlacement,
	sunDirX: number,
	sunDirY: number,
	shadowLength: number
) => {
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

		if (dot > 0) {
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

		ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
		ctx.beginPath()

		silhouettePoints.forEach((p, i) => {
			if (i === 0) {
				ctx.moveTo(p.x, p.y)
			} else {
				ctx.lineTo(p.x, p.y)
			}
		})

		for (let i = silhouettePoints.length - 1; i >= 0; i--) {
			const p = silhouettePoints[i]
			const shadowX = p.x - sunDirX * shadowLength
			const shadowY = p.y - sunDirY * shadowLength
			ctx.lineTo(shadowX, shadowY)
		}

		ctx.closePath()
		ctx.fill()
	}
}

