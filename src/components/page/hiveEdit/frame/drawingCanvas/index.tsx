import React, { useState, useRef, useLayoutEffect } from 'react'
import Button from '../../../../shared/button'
import colors from '../../../../colors.ts'
import Checkbox from '../../../../icons/checkbox.js'
import FrameCells from '../../../../icons/frameCells.js'
import T from '../../../../shared/translate'
import Loader from '../../../../shared/loader'
import styles from './styles.module.less'
import QueenButton from '../queenButton'
import LeftChevron from '../../../../icons/leftChevron.tsx'
import RightChevron from '../../../../icons/rightChevron.tsx'

let lineWidth = 0
let isMousedown = false
let points = []
const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1

let cameraOffset = { x: 0, y: 0 }
let cameraZoom = 1
let globalCameraZoom = 1
let MAX_ZOOM = 100
let MIN_ZOOM = 1
let MED_ZOOM = 2

let zoomEnabled = false;

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

let REL_PX;
function drawDetectedCells(detectedFrameCells, ctx, canvas) {
	REL_PX = canvas.width / 1024
	if (detectedFrameCells.length > 0) {
		for (let dt of detectedFrameCells) {
			let cls, probability, x, y, r
			[cls, x, y, r, probability] = dt
			ctx.globalAlpha = 0.3 + probability / 100

			ctx.beginPath()
			switch (cls) {
				case 0: //'brood-capped':
					ctx.strokeStyle = colors.cappedBroodColor
					ctx.fillStyle = colors.cappedBroodColor
					break

				case 1: //eggs:
					ctx.strokeStyle = colors.eggsColor
					ctx.fillStyle = colors.eggsColor
					break

				case 2: //'honey':
					ctx.strokeStyle = colors.honeyColor
					ctx.fillStyle = colors.honeyColor
					break

				case 3: //brood = Larves
					ctx.strokeStyle = colors.broodColor
					ctx.fillStyle = colors.broodColor
					break

				case 4: //'nectar':
					ctx.strokeStyle = colors.nectarColor
					ctx.fillStyle = colors.nectarColor
					break

				case 5://empty:
					ctx.strokeStyle = colors.emptyCellColor
					ctx.fillStyle = colors.emptyCellColor
					break

				case 6://'pollen':
					ctx.strokeStyle = colors.pollenColor
					ctx.fillStyle = colors.pollenColor
					break
			}

			ctx.lineWidth = 2 * REL_PX
			ctx.arc(
				x * canvas.width,
				y * canvas.height,
				r * canvas.width,
				0,
				2 * Math.PI
			)
			ctx.fill()
		}
		ctx.globalAlpha = 1
	}
}


function drawDetectedVarroa(ctx, detectedVarroa, canvas) {
	REL_PX = canvas.width / 1024
	if (detectedVarroa.length > 0) {
		for (let dt of detectedVarroa) {
			let { c, h, n, w, x, y } = dt
			ctx.globalAlpha = 0.5 + c / 100

			ctx.beginPath()
			ctx.strokeStyle = 'red'
			ctx.lineWidth = 8 * REL_PX
			ctx.arc(
				x * canvas.width,
				y * canvas.height,
				w * canvas.width * 1.5,
				0,
				2 * Math.PI
			)

			ctx.stroke()
		}
		ctx.globalAlpha = 1
	}
}

function drawQueenCups(queenCups, ctx, canvas) {
	REL_PX = canvas.width / 1024
	if (queenCups.length > 0) {
		for (let dt of queenCups) {
			const { n, x, y, x2, y2, c } = dt
			ctx.globalAlpha = 1 //0.4 + c / 100

			ctx.beginPath()
			ctx.strokeStyle = 'red'
			// ctx.fillStyle = 'blue'

			ctx.lineWidth = 6 * REL_PX

			ctx.roundRect(

				x * canvas.width,
				y * canvas.height,

				(x2 - x) * canvas.width,
				(y2 - y) * canvas.height,


				10 * REL_PX
			)

			ctx.stroke();
			// ctx.fill()
		}
		ctx.globalAlpha = 1
	}
}

function drawDetectedBees(detectedBees, ctx, canvas, showBees, showDrones, showQueens) {
	REL_PX = canvas.width / 1024
	if (detectedBees.length > 0) {
		for (let dt of detectedBees) {
			if (!showBees && (dt.n == 0 || dt.n == 2)) continue;
			if (!showDrones && dt.n == 1) continue;
			if (!showQueens && dt.n == 3) continue;
			// if (dt.n == 3) continue;// queen detection is too poor to show it

			ctx.globalAlpha = 0.4 + dt.c

			ctx.beginPath()
			switch (parseInt(dt.n, 10)) {
				case 0: //bee-worker
					ctx.fillStyle = ctx.strokeStyle = colors.beeWorker
					dt.nText = 'worker'
					ctx.lineWidth = 2 * REL_PX
					break
				case 1:
					ctx.fillStyle = ctx.strokeStyle = colors.drone
					dt.nText = 'drone'
					ctx.lineWidth = 2 * REL_PX
					break
				case 2: // bees carrying pollen
					ctx.fillStyle = ctx.strokeStyle = colors.beeWorkerPollen
					dt.nText = 'worker + pollen'
					ctx.lineWidth = 2 * REL_PX
					break

				case 3:
					ctx.fillStyle = ctx.strokeStyle = colors.queen
					dt.nText = 'queen'
					ctx.lineWidth = 4 * REL_PX
					break
			}

			ctx.roundRect(
				(dt.x - dt.w / 2) * canvas.width,
				(dt.y - dt.h / 2) * canvas.height,
				dt.w * canvas.width,
				dt.h * canvas.height,
				5 * REL_PX
			)
			ctx.stroke()

			ctx.font = Math.floor(8 * REL_PX) + 'px Arial'
			ctx.lineWidth = 0.8 * REL_PX
			ctx.fillText(dt.nText,
				(dt.x - dt.w / 2) * canvas.width + 5,
				(dt.y + dt.h / 2) * canvas.height - 3
			)
			// ctx.fill()
		}
		ctx.globalAlpha = 1
	}
}

function getEventLocation(canvas, e) {
	if (e.touches && e.touches.length == 1) {
		return { x: e.touches[0].clientX, y: e.touches[0].clientY }
	} else if (e.clientX && e.clientY) {
		var rect = canvas.getBoundingClientRect();
		var x = e.clientX - rect.left;
		var y = e.clientY - rect.top;

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
) {
	// size
	var width = img ? parseInt(img.width) : 1024
	var height = img ? parseInt(img.height) : 768

	// see hiveEdit
	const boxesWrap = document.getElementById('boxesWrap');
	let canvasParentWidth = 1024;

	if (boxesWrap) {
		// Access the width of the external HTML element using offsetWidth
		canvasParentWidth = document.documentElement.clientWidth - boxesWrap.offsetWidth - 40;
	}

	//UI BREAKING POINT
	const isMobileView = document.body.clientWidth < 1200
	zoomEnabled = !isMobileView
	const canvasWidth = isMobileView ? document.body.clientWidth : canvasParentWidth
	const tmpw = dpr * Math.floor(canvasWidth)
	canvas.width = tmpw
	canvas.height = tmpw * (height / width)
	canvas.style.width = `${canvas.width / dpr}px`
	canvas.style.height = `${canvas.height / dpr}px`

	ctx.imageSmoothingEnabled = true
}

function drawCanvasLayers(
	canvas,
	ctx,
	strokeHistory,

	showBees, showDrones, showQueens, detectedBees,
	showCells, detectedCells,
	showQueenCups, queenCups,

	showVarroa, detectedVarroa
) {
	ctx.clearRect(0, 0, canvas.width, canvas.height)

	if (img) {
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
	}

	if (showCells) {
		drawDetectedCells(detectedCells, ctx, canvas)
	}

	if (showVarroa) {
		drawDetectedVarroa(ctx, detectedVarroa, canvas)
	}

	if (showBees || showDrones || showQueens) {
		drawDetectedBees(detectedBees, ctx, canvas, showBees, showDrones, showQueens)
	}

	if (showQueenCups) {
		drawQueenCups(queenCups, ctx, canvas)
	}

	if (strokeHistory && strokeHistory.length > 0) {
		redrawStrokes(canvas, ctx, strokeHistory)
	}
}

let scrollIndex = 0
let zoomTransforms = []
let img;

export default function DrawingCanvas({
	imageUrl,
	resizes,
	strokeHistory,

	detectedQueenCups,
	detectedBees,
	detectedCells,
	detectedVarroa,

	onStrokeHistoryUpdate,
	frameSideFile,
	frameMetrics,
	frameSide
}) {
	if (!imageUrl) {
		return
	}
	const ref = useRef(null)
	const [showBees, setBeeVisibility] = useState(true)
	const [panelVisible, setPanelVisible] = useState(false)
	const [showDrones, setDroneVisibility] = useState(true)
	const [showCells, setCellVisibility] = useState(true)
	const [showQueenCups, setQueenCups] = useState(true)
	const [showVarroa, setShowVarroa] = useState(false)
	const [version, setVersion] = useState(0)

	let thumbnailUrl = imageUrl
	if (resizes && resizes.length > 0) {
		// iterate through resizes and pick most suitable thumbnail that matches device width
		for (let i = 0; i < resizes.length; i++) {
			if (resizes[i].width > 128) {
				thumbnailUrl = resizes[i].url
			}
		}
	}
	const [canvasUrl, setCanvasUrl] = useState(thumbnailUrl)

	const showQueens = frameSideFile.queenDetected

	// trigger re-draw within useEffect
	function clearHistory() {
		points.length = 0
		strokeHistory.length = 0
		setVersion(version + 1)
		onStrokeHistoryUpdate(strokeHistory)
	}

	function undoDraw() {
		strokeHistory.pop()
		setVersion(version + 1)
		onStrokeHistoryUpdate(strokeHistory)
	}

	let canvas, ctx

	async function initImage(url) {
		return new Promise((resolve, reject) => {
			let tmpImg = document.createElement('img')
			// resizes
			tmpImg.src = url
			tmpImg.onload = () => {
				resolve(tmpImg)
			}

			tmpImg.onerror = (e) => {
				reject(e)
			}
		})
	}

	function initCanvas() {
		canvas = ref.current

		if (!canvas) return

		ctx = canvas.getContext('2d')

		function initAndRedraw() {
			initCanvasSize(
				canvas,
				ctx
			)
			drawCanvasLayers(
				canvas,
				ctx,
				strokeHistory,

				showBees, showDrones, showQueens, detectedBees,

				showCells, detectedCells,
				showQueenCups, detectedQueenCups,
				showVarroa, detectedVarroa
			)
		}

		window.onresize = debounce(initAndRedraw, 500)
		initAndRedraw()

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
						points.length = 0

						onStrokeHistoryUpdate(strokeHistory)
					}
				})

				lineWidth = 0
			})
		}
	}

	useLayoutEffect(() => {
		(async () => {
			img = await initImage(canvasUrl)
			initCanvas()
		})();
	}, [imageUrl])

	useLayoutEffect(() => {
		canvas = ref.current
		ctx = canvas.getContext('2d')

		drawCanvasLayers(
			canvas,
			ctx,
			strokeHistory,
			showBees,
			showDrones,
			showQueens,
			detectedBees,
			showCells,
			detectedCells,
			showQueenCups,
			detectedQueenCups,
			showVarroa,
			detectedVarroa
		)

		function handleScroll(event) {
			if (isMousedown || !zoomEnabled) {
				return
			}
			let zoomAmount //event.deltaY * SCROLL_SENSITIVITY
			zoomAmount = event.deltaY > 0 ? -0.1 : 0.1 //event.deltaY * SCROLL_SENSITIVITY;


			// use high-res image if user starts to zoom
			if (globalCameraZoom > MED_ZOOM && canvasUrl != imageUrl) {
				setCanvasUrl(imageUrl)
				initImage(imageUrl).then((r) => {
					img = r;
				})
			}

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
				setVersion(version + 1)
			} else if (scrollIndex < MAX_ZOOM) {
				if (
					globalCameraZoom * (1 + zoomAmount) <= MAX_ZOOM &&
					globalCameraZoom * (1 + zoomAmount) >= MIN_ZOOM
				) {
					cameraZoom = 1 + zoomAmount
					globalCameraZoom += zoomAmount
				}

				// zoom
				cameraOffset.x = -(dpr * getEventLocation(canvas, event).x) * (cameraZoom - 1)
				cameraOffset.y = -(dpr * getEventLocation(canvas, event).y) * (cameraZoom - 1)

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
				setVersion(version + 1)
			}

			event.preventDefault()
		}

		canvas.removeEventListener('wheel', handleScroll)
		canvas.addEventListener('wheel', handleScroll)
		return () => canvas.removeEventListener('wheel', handleScroll)
	}, [imageUrl, version, showBees, showVarroa, showDrones, showCells, showQueenCups, detectedBees, detectedCells, detectedVarroa])


	return (
		<div style="position:relative;overflow:hidden;">
			<div className={styles.buttonPanel} style={`left: ${panelVisible ? 0 : -200}px`}>
				<div class={styles.buttonGrp}>
					<Button onClick={() => { setPanelVisible(!panelVisible) }}
						style={`position: absolute;right: -43px;top: 100px;border-radius:0 20px 20px 0; border: 2px solid white;border-left:none;`}>
						{panelVisible ? <LeftChevron /> : <RightChevron />}
					</Button>

					<Button onClick={() => { setBeeVisibility(!showBees) }}>
						{frameSideFile.isBeeDetectionComplete && <Checkbox on={showBees} />}
						{!frameSideFile.isBeeDetectionComplete && <Loader size={0} />}
						<span>
							<T ctx="this is a button that toggles visibility of worker bees on an image">Worker bees</T>
							{frameSideFile.detectedWorkerBeeCount > 0 && <>({frameSideFile.detectedWorkerBeeCount})</>}
						</span>
					</Button>

					<QueenButton
						frameSide={frameSide}
						frameSideFile={frameSideFile} />

					<Button onClick={() => { setDroneVisibility(!showDrones) }}>
						{frameSideFile.isBeeDetectionComplete && <Checkbox on={showDrones} />}
						{!frameSideFile.isBeeDetectionComplete && <Loader size={0} />}
						<span>
							<T ctx="this is a button that toggles visibility of drone bees on an image">Drones</T>
							{frameSideFile.detectedDroneCount > 0 && <>({frameSideFile.detectedDroneCount})</>}
						</span>
					</Button>

					{detectedQueenCups && <Button onClick={() => { setQueenCups(!showQueenCups) }}>
						{frameSideFile.isQueenCupsDetectionComplete && <Checkbox on={showQueenCups} />}
						{!frameSideFile.isQueenCupsDetectionComplete && <Loader size={0} />}
						<span><T ctx="this is a button that toggles visibility (on an image) of beewax construction where queen bee is being nursed">Queen cups</T></span>
					</Button>}


					<Button onClick={() => { setShowVarroa(!showVarroa) }}>
						{frameSideFile.isBeeDetectionComplete && <Checkbox on={showVarroa} />}
						{!frameSideFile.isBeeDetectionComplete && <Loader size={0} />}
						<span>
							<T ctx="this is a button that toggles visibility of varroa destructor mites on an image">Varroa mites</T>
							{frameSideFile.varroaCount > 0 && <>({frameSideFile.varroaCount})</>}
						</span>
					</Button>

					{detectedCells &&
						<Button onClick={() => { setCellVisibility(!showCells) }}>
							{frameSideFile.isCellsDetectionComplete && <Checkbox on={showCells} />}
							{!frameSideFile.isCellsDetectionComplete && <Loader size={0} />}

							<span>
								<T ctx="this is a button that toggles visibility of different types of cells in a beehive frame - brood, pollen, honey etc">Frame cells</T>
								{frameSideFile.isCellsDetectionComplete && <FrameCells />}
							</span>
						</Button>}

					{showCells && frameMetrics}
				</div>
			</div>

			<canvas ref={ref} id="container" style="width:100%;">
				Sorry, your browser is too old for this demo.
			</canvas>

			<div class={styles.buttonGrp}>
				<div style="flex-grow:1"></div>
				<Button onClick={clearHistory}><T ctx="this is a button that cleans drawing made on an image with ipad pencil or mouse">Clear drawing</T></Button>
				<Button onClick={undoDraw}><T>Undo</T></Button>
			</div>
		</div>
	)
}
