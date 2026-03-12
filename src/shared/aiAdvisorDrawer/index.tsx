import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { apiClient, gql, useMutation } from '@/api'
import { getApiary } from '@/models/apiary'
import { getHive } from '@/models/hive'
import { getFamilyByHive } from '@/models/family'
import { getBoxes } from '@/models/boxes'
import { getFrames } from '@/models/frames'
import { getFrameSideCells } from '@/models/frameSideCells'
import { getFrameSideFile } from '@/models/frameSideFile'
import { getUser } from '@/models/user'
import { listInspections } from '@/models/inspections'

import beekeeperURL from '@/assets/beekeeper.png'
import styles from './styles.module.less'

type ChatMessage = {
	id: string
	role: 'assistant' | 'system' | 'error'
	text?: string
	html?: string
	loading?: boolean
}

const METRICS_QUERY = gql`
	query advisorMetrics($hiveId: ID!, $timeRangeMin: Int, $timeFrom: DateTime!, $timeTo: DateTime!) {
		weightKg(hiveId: $hiveId, timeRangeMin: $timeRangeMin) {
			... on MetricFloatList {
				metrics {
					t
					v
				}
			}
			... on TelemetryError {
				message
				code
			}
		}
		temperatureCelsius(hiveId: $hiveId, timeRangeMin: $timeRangeMin) {
			... on MetricFloatList {
				metrics {
					t
					v
				}
			}
			... on TelemetryError {
				message
				code
			}
		}
		entranceMovement(hiveId: $hiveId, timeFrom: $timeFrom, timeTo: $timeTo) {
			... on EntranceMovementList {
				metrics {
					time
					beesIn
					beesOut
					netFlow
				}
			}
			... on TelemetryError {
				message
				code
			}
		}
	}
`

const GENERATE_ADVICE_MUTATION = gql`
	mutation generateHiveAdvice($hiveID: ID, $adviceContext: JSON, $langCode: String) {
		generateHiveAdvice(hiveID: $hiveID, adviceContext: $adviceContext, langCode: $langCode)
	}
`

function buildId(prefix: string) {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getHiveContext(pathname: string) {
	const matches = pathname.match(/^\/apiaries\/(\d+)\/hives\/(\d+)(?:\/|$)/)
	if (!matches) return null
	return {
		apiaryId: +matches[1],
		hiveId: +matches[2],
	}
}

export default function AIAdvisorDrawer() {
	const location = useLocation()
	const navigate = useNavigate()
	const runRef = useRef(0)
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [generateAdvice] = useMutation(GENERATE_ADVICE_MUTATION)

	const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
	const isOpen = searchParams.get('aiAdvisor') === '1'
	const hiveContext = useMemo(() => getHiveContext(location.pathname), [location.pathname])
	const shouldRender = isOpen && !!hiveContext

	function closeDrawer() {
		const nextParams = new URLSearchParams(location.search)
		nextParams.delete('aiAdvisor')
		const nextSearch = nextParams.toString()
		navigate(`${location.pathname}${nextSearch ? `?${nextSearch}` : ''}`, { replace: true })
	}

	function addMessage(msg: ChatMessage) {
		setMessages((prev) => [...prev, msg])
	}

	function updateMessage(id: string, patch: Partial<ChatMessage>) {
		setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, ...patch } : msg)))
	}

	useEffect(() => {
		if (!shouldRender || !hiveContext) {
			return
		}

		const runId = Date.now()
		runRef.current = runId
		setMessages([
			{
				id: buildId('intro'),
				role: 'assistant',
				text: 'I will analyze this hive context and prepare a status summary with next-step recommendations.',
			},
		])

		const run = async () => {
			try {
				const hiveStepId = buildId('step')
				addMessage({ id: hiveStepId, role: 'system', text: 'Loading hive information...', loading: true })

				const [user, apiary, hive, family, boxes] = await Promise.all([
					getUser(),
					getApiary(hiveContext.apiaryId),
					getHive(hiveContext.hiveId),
					getFamilyByHive(hiveContext.hiveId),
					getBoxes({ hiveId: hiveContext.hiveId }),
				])

				if (runRef.current !== runId) return

				const framesByBox = {}
				for (let i in boxes) {
					const frames = Object.assign({}, await getFrames({ boxId: +boxes[i].id }))
					delete boxes[i].color

					for (let j in frames) {
						if (!frames[j].leftSide || !frames[j].rightSide) continue

						frames[j].leftSide.cells = await getFrameSideCells(+frames[j].leftId)
						frames[j].rightSide.cells = await getFrameSideCells(+frames[j].rightId)
						const leftSide = frames[j].leftSide as any
						const rightSide = frames[j].rightSide as any

						const leftFile = await getFrameSideFile({ frameSideId: +frames[j].leftId })
						leftSide.detectedQueenCupsCount = leftFile?.detectedQueenCups?.length || 0
						leftSide.isQueenDetected = leftFile?.queenDetected || false

						const rightFile = await getFrameSideFile({ frameSideId: +frames[j].rightId })
						rightSide.detectedQueenCupsCount = rightFile?.detectedQueenCups?.length || 0
						rightSide.isQueenDetected = rightFile?.queenDetected || false
					}

					framesByBox[boxes[i].id] = frames
				}

				updateMessage(hiveStepId, {
					text: `Loaded hive information (${boxes.length} boxes).`,
					loading: false,
				})

				const inspectionsStepId = buildId('step')
				addMessage({ id: inspectionsStepId, role: 'system', text: 'Loading past inspections...', loading: true })
				const inspections = await listInspections(hiveContext.hiveId)

				if (runRef.current !== runId) return
				updateMessage(inspectionsStepId, {
					text: `Loaded past inspections (${inspections.length}).`,
					loading: false,
				})

				const metricsStepId = buildId('step')
				addMessage({ id: metricsStepId, role: 'system', text: 'Loading metrics...', loading: true })

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
				updateMessage(metricsStepId, {
					text: 'Loaded recent telemetry metrics.',
					loading: false,
				})

				const summarizeStepId = buildId('step')
				addMessage({
					id: summarizeStepId,
					role: 'system',
					text: 'Sending context to AI Advisor for summarization...',
					loading: true,
				})

				const adviceContext = {
					apiary,
					hive,
					family,
					boxes,
					frames: framesByBox,
					inspections,
					metrics: metricsResult?.data,
				}

				const response = await generateAdvice({
					hiveID: hiveContext.hiveId,
					langCode: user?.lang,
					adviceContext,
				})

				if (runRef.current !== runId) return
				updateMessage(summarizeStepId, {
					text: 'Summary generated.',
					loading: false,
				})

				const adviceHtml = response?.data?.generateHiveAdvice
				if (adviceHtml) {
					addMessage({ id: buildId('reply'), role: 'assistant', html: adviceHtml })
				} else {
					addMessage({
						id: buildId('reply'),
						role: 'error',
						text: 'AI Advisor did not return a summary yet. Backend endpoint may still be unavailable.',
					})
				}
			} catch (error) {
				if (runRef.current !== runId) return
				addMessage({
					id: buildId('error'),
					role: 'error',
					text: 'Failed to complete AI advisory run. Please try again in a moment.',
				})
			}
		}

		run()

		return () => {
			runRef.current = 0
		}
	}, [hiveContext, shouldRender])

	if (!shouldRender) {
		return null
	}

	return (
		<div className={styles.drawer}>
			<div className={styles.header}>
				<img className={styles.avatar} src={beekeeperURL} alt="AI Advisor avatar" />
				<div className={styles.headerText}>
					<h3 className={styles.title}>AI Advisor</h3>
					<p className={styles.subtitle}>Hive-aware analysis in progress</p>
				</div>
				<button className={styles.closeBtn} type="button" onClick={closeDrawer} aria-label="Close AI Advisor">
					×
				</button>
			</div>
			<div className={styles.body}>
				{messages.map((message) => {
					const roleClass =
						message.role === 'assistant'
							? styles.assistant
							: message.role === 'error'
								? styles.error
								: styles.system
					return (
						<div key={message.id} className={`${styles.message} ${roleClass}`}>
							{message.html ? (
								<div dangerouslySetInnerHTML={{ __html: message.html }} />
							) : (
								<div>
									{message.text}
									{message.loading && (
										<span className={styles.typing}>
											<span className={styles.dot} />
											<span className={styles.dot} />
											<span className={styles.dot} />
										</span>
									)}
								</div>
							)}
						</div>
					)
				})}
			</div>
		</div>
	)
}
