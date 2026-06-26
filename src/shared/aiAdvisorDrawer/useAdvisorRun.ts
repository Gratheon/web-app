import { useEffect } from 'react'
import type { MutableRefObject } from 'react'

import { apiClient } from '@/api'
import { getApiary } from '@/models/apiary'
import { getHive } from '@/models/hive'
import { getFamilyByHive } from '@/models/family'
import { getBoxes, boxTypes, normalizeGateHoleCount } from '@/models/boxes'
import { getFrames } from '@/models/frames'
import { getFrameSideCells } from '@/models/frameSideCells'
import {
	getFrameSideFile,
	getFrameSidePreviewImage,
} from '@/models/frameSideFile'
import { getUser } from '@/models/user'
import { listInspections } from '@/models/inspections'
import { listHiveLogs, syncHiveLogsFromBackend } from '@/models/hiveLog'
import {
	convertFromCelsius,
	getPreferredTemperatureUnit,
	temperatureUnitSymbol,
} from '@/shared/temperatureUnit'

import type { ChatMessage } from './types'
import {
	APIARY_ADVISOR_QUERY,
	APIARY_PLACEMENT_QUERY,
	APIARY_WEATHER_QUERY,
	FRAME_SIDE_IMAGE_QUERY,
	METRICS_QUERY,
} from './queries'
import {
	angularDelta,
	buildId,
	canUseAIAdvisor,
	compactCellSummary,
	distance2d,
	findSelectedFramePayload,
	findSelectedFrameRaw,
	pickOptimizedImage,
	pruneForPreview,
	truncateText,
} from './utils'

type UseAdvisorRunParams = {
	hiveContext: any
	apiaryOverviewContext: any
	shouldRender: boolean
	viewContext: any
	generateAdvice: (variables: any) => Promise<any>
	labels: any
	location: { pathname: string }
	frameRouteContext: any
	fetchAiUsage: () => Promise<void>
	runRef: MutableRefObject<number>
	setBillingLocked: (value: boolean) => void
	setAiUsage: (value: any | null) => void
	setAdviceContext: (value: any | null) => void
	setAdvisorTargetHiveID: (value: number | undefined) => void
	setAdvisorLangCode: (value: string | undefined) => void
	setMessages: (value: ChatMessage[]) => void
	addMessage: (message: ChatMessage) => void
	removeMessage: (id: string) => void
}

export function useAdvisorRun({
	hiveContext,
	apiaryOverviewContext,
	shouldRender,
	viewContext,
	generateAdvice,
	labels,
	location,
	frameRouteContext,
	fetchAiUsage,
	runRef,
	setBillingLocked,
	setAiUsage,
	setAdviceContext,
	setAdvisorTargetHiveID,
	setAdvisorLangCode,
	setMessages,
	addMessage,
	removeMessage,
}: UseAdvisorRunParams) {
	useEffect(() => {
		if (!shouldRender) {
			return
		}

		const runId = Date.now()
		runRef.current = runId
		setBillingLocked(false)
		setAiUsage(null)
		setAdviceContext(null)
		setAdvisorTargetHiveID(undefined)
		setAdvisorLangCode(undefined)
		setMessages([
			{
				id: buildId('view'),
				role: 'system',
				html: `<div><strong>${labels.currentViewLabel}:</strong> ${viewContext.name}<br/>${viewContext.description}</div>`,
			},
			{
				id: buildId('shortcuts'),
				role: 'system',
				shortcuts: viewContext.shortcuts,
				shortcutsTitle: labels.keyboardShortcutsLabel,
			},
		])

		const run = async () => {
			let pendingReplyId: string | null = null
			try {
				const user = await getUser()
				setAdvisorLangCode(user?.lang)
				if (runRef.current !== runId) return
				const temperatureUnit = getPreferredTemperatureUnit(user)

				if (!canUseAIAdvisor(user?.billingPlan)) {
					setBillingLocked(true)
					return
				}
				await fetchAiUsage()
				if (runRef.current !== runId) return

				if (!hiveContext && !apiaryOverviewContext) {
					addMessage({
						id: buildId('context'),
						role: 'system',
						text: labels.openHiveDetailMessage,
					})
					return
				}
				if (apiaryOverviewContext && !hiveContext) {
					const localApiary = await getApiary(apiaryOverviewContext.apiaryId)
					const apiaryResult = await apiClient
						.query(APIARY_ADVISOR_QUERY, { id: apiaryOverviewContext.apiaryId })
						.toPromise()
					const placementResult = await apiClient
						.query(APIARY_PLACEMENT_QUERY, {
							apiaryId: apiaryOverviewContext.apiaryId,
						})
						.toPromise()

					if (runRef.current !== runId) return

					const apiary = apiaryResult?.data?.apiary || localApiary || null
					const hives = Array.isArray(apiary?.hives) ? apiary.hives : []
					const placements = placementResult?.data?.hivePlacements || []
					const obstacles = placementResult?.data?.apiaryObstacles || []
					const lat = Number(apiary?.lat || 0)
					const lng = Number(apiary?.lng || 0)
					const hasCoordinates =
						!!lat && !!lng && !Number.isNaN(lat) && !Number.isNaN(lng)

					let weatherPayload = null
					if (hasCoordinates) {
						const weatherResult = await apiClient
							.query(APIARY_WEATHER_QUERY, { lat: `${lat}`, lng: `${lng}` })
							.toPromise()
						weatherPayload = weatherResult?.data?.weather || null
					}

					if (runRef.current !== runId) return

					const weather = {
						temperature: convertFromCelsius(
							weatherPayload?.current_weather?.temperature,
							temperatureUnit
						),
						temperatureUnit: temperatureUnitSymbol(temperatureUnit),
						windSpeed: weatherPayload?.current_weather?.windspeed ?? null,
						windDirection:
							weatherPayload?.current_weather?.winddirection ??
							weatherPayload?.current?.wind_direction_10m ??
							weatherPayload?.hourly?.winddirection_10m?.[0] ??
							null,
						rain:
							weatherPayload?.current?.precipitation ??
							weatherPayload?.hourly?.rain?.[0] ??
							null,
						pressure:
							weatherPayload?.current?.surface_pressure ??
							weatherPayload?.current?.pressure_msl ??
							weatherPayload?.hourly?.surface_pressure?.[0] ??
							weatherPayload?.hourly?.pressure_msl?.[0] ??
							null,
						elevation: weatherPayload?.elevation ?? null,
					}

					const hivePlacements = hives.map((hive: any) => {
						const placement = placements.find(
							(entry: any) => String(entry?.hiveId) === String(hive?.id)
						)
						const nearbyObstacles = placement
							? obstacles
									.map((obstacle: any) => {
										const obstacleDistance = distance2d(
											Number(placement.x),
											Number(placement.y),
											Number(obstacle?.x || 0),
											Number(obstacle?.y || 0)
										)
										const obstacleKind =
											obstacle?.type === 'CIRCLE' ? 'tree' : 'building'
										return {
											id: obstacle?.id,
											kind: obstacleKind,
											label: obstacle?.label || obstacleKind,
											distancePx: Math.round(obstacleDistance),
										}
									})
									.filter((obstacle: any) => obstacle.distancePx <= 150)
							: []

						const facingDirectionDeg = placement?.rotation ?? null
						const windDirectionDeg = weather.windDirection
						const windAngleDeltaDeg =
							facingDirectionDeg === null || windDirectionDeg === null
								? null
								: Math.round(
										angularDelta(+facingDirectionDeg, +windDirectionDeg)
								  )

						return {
							hiveId: hive?.id,
							hiveNumber: hive?.hiveNumber,
							familyName: hive?.family?.name || null,
							boxCount: hive?.boxCount ?? null,
							position: placement
								? {
										x: placement.x,
										y: placement.y,
								  }
								: null,
							facingDirectionDeg,
							windDirectionDeg,
							windAngleDeltaDeg,
							nearbyObstacles,
						}
					})

					const adviceContext: any = {
						mode: 'apiary-overview',
						apiary: {
							id: apiary?.id,
							name: apiary?.name,
							type: apiary?.type,
							lat: apiary?.lat,
							lng: apiary?.lng,
						},
						weather,
						hivePlacements,
						obstacles: obstacles.map((obstacle: any) => ({
							id: obstacle?.id,
							type: obstacle?.type,
							label: obstacle?.label,
							x: obstacle?.x,
							y: obstacle?.y,
							width: obstacle?.width,
							height: obstacle?.height,
							radius: obstacle?.radius,
							rotation: obstacle?.rotation,
						})),
						currentView: {
							pathname: location.pathname,
							view: viewContext.name,
							apiarySelection: apiaryOverviewContext,
						},
					}
					setAdviceContext(adviceContext)
					setAdvisorTargetHiveID(undefined)

					const payloadOverview = {
						scope: 'apiary-context',
						selection: apiaryOverviewContext,
						counts: {
							hives: hives.length,
							placements: placements.length,
							obstacles: obstacles.length,
						},
						weatherSummary: {
							temperature: weather.temperature,
							windSpeed: weather.windSpeed,
							windDirection: weather.windDirection,
							rain: weather.rain,
						},
						contextPreview: pruneForPreview(adviceContext),
					}

					addMessage({
						id: buildId('payload'),
						role: 'system',
						payloadOverview,
					})

					pendingReplyId = buildId('reply-loading')
					addMessage({
						id: pendingReplyId,
						role: 'assistant',
						text: labels.advisorThinkingMessage,
						loading: true,
					})

					const response = await generateAdvice({
						hiveID: undefined,
						langCode: user?.lang,
						adviceContext,
					})

					if (runRef.current !== runId) return

					const adviceHtml = response?.data?.generateHiveAdvice
					if (adviceHtml) {
						removeMessage(pendingReplyId)
						addMessage({
							id: buildId('reply'),
							role: 'assistant',
							html: adviceHtml,
						})
					} else {
						removeMessage(pendingReplyId)
						addMessage({
							id: buildId('reply'),
							role: 'error',
							text: labels.summaryUnavailableMessage,
						})
					}
					await fetchAiUsage()
					return
				}

				const [apiary, hive, family, boxes] = await Promise.all([
					getApiary(hiveContext.apiaryId),
					getHive(hiveContext.hiveId),
					getFamilyByHive(hiveContext.hiveId),
					getBoxes({ hiveId: hiveContext.hiveId }),
				])
				const boxesForAdvice = (boxes || []).map((box: any) => {
					const normalized = { ...box }
					delete normalized.color
					if (normalized?.type === boxTypes.GATE) {
						normalized.holeCount = normalizeGateHoleCount(normalized.holeCount)
					}
					return normalized
				})

				if (runRef.current !== runId) return

				const framesByBox = {}
				for (let i in boxesForAdvice) {
					const frames = Object.assign(
						{},
						await getFrames({ boxId: +boxesForAdvice[i].id })
					)

					for (let j in frames) {
						if (!frames[j].leftSide || !frames[j].rightSide) continue
						;(frames[j].leftSide as any).cells = compactCellSummary(
							await getFrameSideCells(+frames[j].leftId)
						)
						;(frames[j].rightSide as any).cells = compactCellSummary(
							await getFrameSideCells(+frames[j].rightId)
						)
						const leftSide = frames[j].leftSide as any
						const rightSide = frames[j].rightSide as any

						const leftFile = await getFrameSideFile({
							frameSideId: +frames[j].leftId,
						})
						leftSide.detectedQueenCupsCount =
							leftFile?.detectedQueenCups?.length || 0
						leftSide.isQueenDetected = leftFile?.queenDetected || false

						const rightFile = await getFrameSideFile({
							frameSideId: +frames[j].rightId,
						})
						rightSide.detectedQueenCupsCount =
							rightFile?.detectedQueenCups?.length || 0
						rightSide.isQueenDetected = rightFile?.queenDetected || false
					}

					framesByBox[boxesForAdvice[i].id] = frames
				}

				const inspections = await listInspections(hiveContext.hiveId)

				if (runRef.current !== runId) return

				await syncHiveLogsFromBackend(hiveContext.hiveId, 200).catch(() => {})
				const changeHistory = await listHiveLogs(hiveContext.hiveId, 200)

				if (runRef.current !== runId) return

				const now = new Date()
				const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
				const metricsResult = await apiClient
					.query(METRICS_QUERY, {
						hiveId: hiveContext.hiveId,
						timeRangeMin: 7 * 24 * 60,
						timeFrom: weekAgo.toISOString(),
						timeTo: now.toISOString(),
					})
					.toPromise()

				if (runRef.current !== runId) return

				const hasFrameSideContext = Boolean(frameRouteContext?.frameSideId)
				let selectedFrameImage: any = null
				if (hasFrameSideContext) {
					const frameImageResult = await apiClient
						.query(FRAME_SIDE_IMAGE_QUERY, {
							frameSideId: frameRouteContext.frameSideId,
						})
						.toPromise()
					let frameFile = frameImageResult?.data?.hiveFrameSideFile?.file
					if (!frameFile) {
						// Fallback to local cache (Dexie) when backend query is temporarily missing.
						frameFile = await getFrameSidePreviewImage(
							frameRouteContext.frameSideId as number
						)
					}
					const optimizedImage = pickOptimizedImage(frameFile)

					selectedFrameImage = {
						frameSideId: frameRouteContext.frameSideId,
						originalUrl: frameFile?.url || null,
						optimizedUrl: optimizedImage?.url || null,
						optimizedMaxDimensionPx: optimizedImage?.maxDimensionPx ?? null,
						source: optimizedImage?.source || null,
					}
				}

				const selectedFrameRaw = findSelectedFrameRaw(
					framesByBox,
					frameRouteContext
				)
				const framesForAdvice = hasFrameSideContext
					? {
							[String(frameRouteContext?.boxId || '')]: selectedFrameRaw
								? { [String((selectedFrameRaw as any).id)]: selectedFrameRaw }
								: {},
					  }
					: framesByBox

				const adviceContext: any = {
					mode: hasFrameSideContext ? 'frame-focus' : 'hive-overview',
					apiary,
					hive,
					family,
					boxes: boxesForAdvice,
					frames: framesForAdvice,
					inspections: inspections.slice(0, 40),
					changeHistory: changeHistory
						.map((entry) => ({
							id: entry.id,
							action: entry.action,
							title: entry.title,
							details: truncateText(entry.details, 500),
							source: entry.source,
							createdAt: entry.createdAt,
							relatedHives: entry.relatedHives || [],
						}))
						.slice(0, 60),
					metrics: metricsResult?.data,
					currentView: {
						pathname: location.pathname,
						view: viewContext.name,
						frameSelection: frameRouteContext,
					},
					frameFocusPrompt: hasFrameSideContext
						? 'Given hive context and the attached optimized frame-side image, analyze this specific frame and provide practical beekeeping advice.'
						: null,
				}
				const selectedFramePayload = findSelectedFramePayload(
					framesByBox,
					frameRouteContext
				)
				if (selectedFramePayload) {
					adviceContext.selectedFrame = selectedFramePayload
				}
				if (selectedFrameImage) {
					adviceContext.selectedFrameImage = selectedFrameImage
				}
				setAdviceContext(adviceContext)
				setAdvisorTargetHiveID(hiveContext.hiveId)

				const payloadOverview = {
					scope: hasFrameSideContext ? 'hive-frame-context' : 'hive-context',
					selection: frameRouteContext || null,
					counts: {
						boxes: boxesForAdvice.length,
						inspections: inspections.length,
						changeHistoryEntries: changeHistory.length,
						frames: Object.values(framesByBox).reduce(
							(total: number, byBox: any) =>
								total + Object.keys(byBox || {}).length,
							0
						),
					},
					selectedFrame: selectedFramePayload,
					metricsSummary: {
						weightPoints: metricsResult?.data?.weightKg?.metrics?.length || 0,
						temperaturePoints:
							metricsResult?.data?.temperatureCelsius?.metrics?.length || 0,
						entrancePoints:
							metricsResult?.data?.entranceMovement?.metrics?.length || 0,
					},
					selectedFrameImage: selectedFrameImage
						? {
								frameSideId: selectedFrameImage.frameSideId,
								optimizedUrl: selectedFrameImage.optimizedUrl,
								optimizedMaxDimensionPx:
									selectedFrameImage.optimizedMaxDimensionPx,
								source: selectedFrameImage.source,
						  }
						: null,
					contextPreview: pruneForPreview(adviceContext),
				}

				addMessage({
					id: buildId('payload'),
					role: 'system',
					payloadOverview,
				})

				pendingReplyId = buildId('reply-loading')
				addMessage({
					id: pendingReplyId,
					role: 'assistant',
					text: labels.advisorThinkingMessage,
					loading: true,
				})

				const response = await generateAdvice({
					hiveID: hiveContext.hiveId,
					langCode: user?.lang,
					adviceContext,
				})

				if (runRef.current !== runId) return

				const adviceHtml = response?.data?.generateHiveAdvice
				const responseErrorMessage = response?.error?.message
				if (adviceHtml) {
					removeMessage(pendingReplyId)
					addMessage({
						id: buildId('reply'),
						role: 'assistant',
						html: adviceHtml,
					})
				} else {
					removeMessage(pendingReplyId)
					addMessage({
						id: buildId('reply'),
						role: 'error',
						text: responseErrorMessage || labels.summaryUnavailableMessage,
					})
				}
				await fetchAiUsage()
			} catch (error) {
				if (runRef.current !== runId) return
				if (pendingReplyId) {
					removeMessage(pendingReplyId)
				}
				addMessage({
					id: buildId('error'),
					role: 'error',
					text: labels.failedAdvisoryMessage,
				})
			}
		}

		run()

		return () => {
			runRef.current = 0
		}
	}, [
		hiveContext,
		apiaryOverviewContext,
		shouldRender,
		viewContext,
		generateAdvice,
		labels.currentViewLabel,
		labels.keyboardShortcutsLabel,
		labels.openHiveDetailMessage,
		labels.advisorThinkingMessage,
		labels.summaryUnavailableMessage,
		labels.failedAdvisoryMessage,
		location.pathname,
		viewContext.name,
		frameRouteContext,
		fetchAiUsage,
	])
}
