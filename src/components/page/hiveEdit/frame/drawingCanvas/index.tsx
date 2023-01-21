import React, { useRef, useEffect, useLayoutEffect } from 'react'
import Loader from '@/components/shared/loader'
import Button from '@/components/shared/button'
import colors from '@/components/colors'

let img
let lineWidth = 0
let isMousedown = false
let points = []
const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1

let cameraOffset = { x: 0, y: 0 }
let cameraZoom = 1
let globalCameraZoom = 1
let MAX_ZOOM = 6
let MIN_ZOOM = 1

let offsetsum = {
	x: 0,
	y: 0,
}

function drawOnCanvas(canvas, ctx, stroke) {
	ctx.strokeStyle = 'white'
	ctx.lineCap = 'round'
	ctx.lineJoin = 'round'
	const l = stroke.length ? stroke.length - 1 : 0

	if (stroke.length >= 3) {
		const xc = (dpr * (canvas.width * (stroke[l].x + stroke[l - 1].x))) / 2
		const yc = (dpr * (canvas.height * (stroke[l].y + stroke[l - 1].y))) / 2

		ctx.lineWidth = dpr * stroke[l - 1].lineWidth * canvas.width

		ctx.quadraticCurveTo(
			dpr * canvas.width * stroke[l - 1].x,
			dpr * canvas.height * stroke[l - 1].y,
			xc,
			yc
		)
		ctx.stroke()
		ctx.beginPath()
		ctx.moveTo(xc, yc)
	} else {
		const point = stroke[l]
		ctx.lineWidth = point.lineWidth * canvas.width
		ctx.strokeStyle = point.color

		ctx.moveTo(point.x * canvas.width, point.y * canvas.height)
		ctx.stroke()

		ctx.beginPath()
	}
}

function redrawStrokes(canvas, ctx, strokeHistory) {
	if (strokeHistory.length === 0) return []
	// ctx.save()

	// // Calculate the zoomed in/out offset and apply it to the canvas
	// const zoomedOutOffsetX = cameraOffset.x / cameraZoom
	// const zoomedOutOffsetY = cameraOffset.y / cameraZoom
	// ctx.translate(zoomedOutOffsetX, zoomedOutOffsetY)

	// // Set the zoom level
	// ctx.scale(cameraZoom, cameraZoom)

	strokeHistory.forEach((stroke) => {
		if (stroke && stroke.length > 0) {
			ctx.beginPath()
			let strokePath = []

			stroke.forEach((point) => {
				strokePath.push(point)
				drawOnCanvas(canvas, ctx, strokePath)
			})
		}
	})
}

function drawDetectedObjects(detectedObjects, ctx, canvas) {
	if (detectedObjects.length > 0) {
		for (let dt of detectedObjects) {
			ctx.globalAlpha = 0.2 + dt.c

			// ctx.strokeStyle = 'black'
			// ctx.strokeText(
			// 	dt.n,
			// 	dt.p[0] * canvas.width + 0.5,
			// 	dt.p[1] * canvas.height - 2.5
			// )

			dt.nText = dt.n
			switch (dt.n) {
				case '0': //bee-worker
				case '2': //bee-worker
					ctx.strokeStyle = colors.beeWorker
					dt.nText = 'worker'
					break
				case '1': // drone
					ctx.strokeStyle = colors.drone
					dt.nText = 'drone'
					break

				case 'brood':
					ctx.strokeStyle = colors.broodColor
					ctx.fillStyle = colors.broodColor
					break
				case 'brood-capped':
					ctx.strokeStyle = colors.cappedBroodColor
					ctx.fillStyle = colors.cappedBroodColor
					break
				case 'drone-brood-capped':
					ctx.strokeStyle = colors.droneBroodColor
					ctx.fillStyle = colors.droneBroodColor
					break
				case 'honey':
					ctx.strokeStyle = colors.honeyColor
					ctx.fillStyle = colors.honeyColor
					break
				case 'pollen':
					ctx.strokeStyle = colors.pollenColor
					ctx.fillStyle = colors.pollenColor
					break
			}
			ctx.beginPath()

			ctx.font = '12px Arial'
			ctx.lineWidth = 1
			ctx.strokeText(dt.nText, dt.x * canvas.width, dt.y * canvas.height - 10)

			switch (dt.n) {
				//circle
				case 'pollen':
				case 'honey':
				case 'brood':
				case 'brood-capped':
				case 'drone-brood':
				case 'drone-brood-capped':
					// ctx.lineWidth = 4
					ctx.arc(
						dt.p[0] * canvas.width + (dt.p[2] * canvas.width) / 2,
						dt.p[1] * canvas.height + (dt.p[3] * canvas.height) / 2,
						Math.min(dt.p[2] * canvas.width, dt.p[3] * canvas.height) / 2,
						0,
						2 * Math.PI
					)
					ctx.fill()
					break

				default:
					ctx.rect(
						(dt.x-dt.w/2) * canvas.width,
						(dt.y-dt.h/2) * canvas.height,
						dt.w * canvas.width,
						dt.h * canvas.height
					)
					ctx.stroke()
			}
		}
		ctx.globalAlpha = 1
	}
}

function getEventLocation(e) {
	if (e.touches && e.touches.length == 1) {
		return { x: e.touches[0].clientX, y: e.touches[0].clientY }
	} else if (e.clientX && e.clientY) {
		const x = e.pageX - e.currentTarget.offsetLeft
		const y = e.pageY - e.currentTarget.offsetTop

		return { x, y }
	}
}

function debounce(func, timeout = 300) {
	let timer
	return (...args) => {
		clearTimeout(timer)
		timer = setTimeout(() => {
			func.apply(this, args)
		}, timeout)
	}
}

function initCanvasSize(
	canvas,
	ctx,
	img,
	strokeHistory,
	showDetections,
	detectedObjects
) {
	// size
	var width = parseInt(img.width)
	var height = parseInt(img.height)
	const tmpw = dpr * Math.floor(document.body.clientWidth * 0.7)
	canvas.width = tmpw
	canvas.height = tmpw * (height / width)
	canvas.style.width = `${canvas.width / dpr}px`
	canvas.style.height = `${canvas.height / dpr}px`

	ctx.imageSmoothingEnabled = true

	drawCanvasLayers(
		canvas,
		ctx,
		img,
		strokeHistory,
		showDetections,
		detectedObjects
	)
}

function drawCanvasLayers(
	canvas,
	ctx,
	img,
	strokeHistory,
	showDetections,
	detectedObjects
) {
	// ctx.translate(-window.innerWidth / 2 + cameraOffset.x, -window.innerHeight / 2 + cameraOffset.y)

	ctx.clearRect(0, 0, canvas.width, canvas.height)
	ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

	if (showDetections) {
		drawDetectedObjects(detectedObjects, ctx, canvas)
	}

	if (strokeHistory && strokeHistory.length > 0) {
		redrawStrokes(canvas, ctx, strokeHistory)
	}
}

let scrollIndex = 0
let zoomTransforms = []

export default ({
	children,
	imageUrl,
	strokeHistory,
	detectedObjects,
	onStrokeHistoryUpdate,
}) => {
	const ref = useRef(null)
	const [show, setShow] = React.useState(false)
	const [showDetections, setDetections] = React.useState(true)
	const [version, setVersion] = React.useState(0)

	// trigger re-draw within useEffect
	function clearHistory() {
		strokeHistory.length = 0
		setVersion(version + 1)
		onStrokeHistoryUpdate(strokeHistory)
	}

	function undoDraw() {
		strokeHistory.pop()
		setVersion(version + 1)
		onStrokeHistoryUpdate(strokeHistory)
	}

	useEffect(() => {
		img = document.createElement('img')
		img.src = imageUrl
		img.onload = () => {
			setShow(true)
		}
	}, [imageUrl])

	if (!show) {
		return <Loader />
	}

	let canvas, ctx

	// on resize
	useLayoutEffect(() => {
		canvas = ref.current
		ctx = canvas.getContext('2d')

		window.onresize = debounce(() => {
			initCanvasSize(
				canvas,
				ctx,
				img,
				strokeHistory,
				showDetections,
				detectedObjects
			)
			drawCanvasLayers(
				canvas,
				ctx,
				img,
				strokeHistory,
				showDetections,
				detectedObjects
			)
		}, 500)

		initCanvasSize(
			canvas,
			ctx,
			img,
			strokeHistory,
			showDetections,
			detectedObjects
		)
		drawCanvasLayers(
			canvas,
			ctx,
			img,
			strokeHistory,
			showDetections,
			detectedObjects
		)

		//drawing
		for (const ev of ['touchstart', 'mousedown']) {
			canvas.addEventListener(ev, function (e) {
				let pressure = 0.5
				let x, y
				var rect = canvas.getBoundingClientRect()

				if (
					e.touches &&
					e.touches[0] &&
					typeof e.touches[0]['force'] !== 'undefined'
				) {
					if (e.touches[0]['force'] > 0) {
						pressure = e.touches[0]['force']
					}
					x = e.touches[0].pageX / canvas.width
					y = e.touches[0].pageY / canvas.height
				} else {
					x = (e.clientX - rect.left) / canvas.width
					y = (e.clientY - rect.top) / canvas.height
				}

				isMousedown = true

				lineWidth = (Math.log(pressure + 1) * 10) / canvas.width
				points.push({ x, y, lineWidth })
				drawOnCanvas(canvas, ctx, points)
			})
		}

		for (const ev of ['touchmove', 'mousemove']) {
			canvas.addEventListener(ev, function (e) {
				if (!isMousedown) return
				e.preventDefault()

				var rect = canvas.getBoundingClientRect()

				let pressure = 0.5
				let x, y
				if (
					e.touches &&
					e.touches[0] &&
					typeof e.touches[0]['force'] !== 'undefined'
				) {
					if (e.touches[0]['force'] > 0) {
						pressure = e.touches[0]['force']
					}

					x = (e.touches[0].clientX - rect.left) / canvas.width
					y = (e.touches[0].clientY - rect.top) / canvas.height
				} else {
					x = (e.clientX - rect.left) / canvas.width
					y = (e.clientY - rect.top) / canvas.height
				}

				// smoothen line width
				lineWidth =
					(Math.log(pressure + 1) * 40 * 0.2 + lineWidth * 0.8) / canvas.width
				points.push({ x, y, lineWidth })

				drawOnCanvas(canvas, ctx, points)
			})
		}

		for (const ev of ['touchend', 'touchleave', 'mouseup']) {
			canvas.addEventListener(ev, function (e) {
				let pressure = 0.5
				let x, y
				var rect = canvas.getBoundingClientRect()

				if (
					e.touches &&
					e.touches[0] &&
					typeof e.touches[0]['force'] !== 'undefined'
				) {
					if (e.touches[0]['force'] > 0) {
						pressure = e.touches[0]['force']
					}
					x = (e.touches[0].clientX - rect.left) / canvas.width
					y = (e.touches[0].clientY - rect.top) / canvas.height
				} else {
					x = (e.clientX - rect.left) / canvas.width
					y = (e.clientY - rect.top) / canvas.height
				}

				lineWidth =
					(Math.log(pressure + 1) * 40 * 0.2 + lineWidth * 0.8) / canvas.width
				points.push({ x, y, lineWidth })

				drawOnCanvas(canvas, ctx, points)

				isMousedown = false

				requestIdleCallback(function () {
					if (points && points.length > 0) {
						if (strokeHistory && strokeHistory.length > 0) {
							strokeHistory.push([...points])
						} else {
							strokeHistory = [[...points]]
						}
						points = []

						onStrokeHistoryUpdate(strokeHistory)
					}
				})

				lineWidth = 0
			})
		}
	}, [imageUrl])

	useLayoutEffect(() => {
		canvas = ref.current
		ctx = canvas.getContext('2d')

		drawCanvasLayers(
			canvas,
			ctx,
			img,
			strokeHistory,
			showDetections,
			detectedObjects
		)
		function handleScroll(event) {
			if (!isMousedown) {
				let zoomAmount //event.deltaY * SCROLL_SENSITIVITY
				zoomAmount = event.deltaY > 0 ? -0.1 : 0.1 //event.deltaY * SCROLL_SENSITIVITY;

				if (zoomAmount) {
					if (zoomAmount < 0) {
						if (scrollIndex > 0) {
							delete zoomTransforms[scrollIndex]
							scrollIndex--
							ctx.setTransform(...zoomTransforms[scrollIndex])
						} else {
							zoomTransforms = []
							cameraOffset.x = 0
							cameraOffset.y = 0
							offsetsum.x = 0
							offsetsum.y = 0
							cameraZoom = 1
							globalCameraZoom = 1
						}
					} else if (scrollIndex < 40) {
						if (
							globalCameraZoom * (1 + zoomAmount) <= MAX_ZOOM &&
							globalCameraZoom * (1 + zoomAmount) >= MIN_ZOOM
						) {
							cameraZoom = 1 + zoomAmount
							globalCameraZoom += zoomAmount
						}

						// zoom
						cameraOffset.x =
							-(dpr * getEventLocation(event).x) * (cameraZoom - 1)
						cameraOffset.y =
							-(dpr * getEventLocation(event).y) * (cameraZoom - 1)

						// if (offsetsum.x < canvas.width && offsetsum.x > -canvas.width && offsetsum.y < canvas.height && offsetsum.y > -canvas.height) {
						offsetsum.x += cameraOffset.x * cameraZoom
						offsetsum.y += cameraOffset.y * cameraZoom

						zoomTransforms[scrollIndex] = [
							globalCameraZoom,
							0,
							0,
							globalCameraZoom,
							offsetsum.x,
							offsetsum.y,
						]

						ctx.setTransform(...zoomTransforms[scrollIndex])

						scrollIndex++
					}

					setVersion(version + 1)
				}

				if (globalCameraZoom > 1 && globalCameraZoom < 4.9) {
					event.preventDefault()
				}
			}
		}

		canvas.removeEventListener('wheel', handleScroll)
		canvas.addEventListener('wheel', handleScroll)
		return () => canvas.removeEventListener('wheel', handleScroll)
	}, [imageUrl, version, showDetections])

	return (
		<div>
			<div style={{ display: 'flex', margin: '3px 0' }}>
				{children}
				<Button onClick={clearHistory}>Clear</Button>
				<Button onClick={undoDraw}>Undo</Button>
				<Button
					onClick={() => {
						setDetections(!showDetections)
					}}
				>
					Toggle objects
				</Button>
			</div>
			<canvas ref={ref} id="container">
				Sorry, your browser is too old for this demo.
			</canvas>
		</div>
	)
}
