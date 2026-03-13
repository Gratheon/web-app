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
import AIAdvisorBillingNotice from '@/shared/aiAdvisorBillingNotice'

type ChatMessage = {
	id: string
	role: 'assistant' | 'system' | 'error'
	text?: string
	html?: string
	loading?: boolean
}

type ViewContext = {
	name: string
	description: string
	shortcuts: Array<{
		keys: string
		action: string
	}>
}

function canUseAIAdvisor(plan?: string | null) {
	const normalized = String(plan || '').toLowerCase()
	return normalized === 'starter' || normalized === 'professional' || normalized === 'enterprise'
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

function getViewContext(pathname: string): ViewContext {
	const isHiveDetailView = /^\/apiaries\/\d+\/hives\/\d+(?:\/|$)/.test(pathname)
	const isHiveListView = pathname === '/' || pathname === '/apiaries' || pathname === '/apiaries/'

	if (isHiveDetailView) {
		return {
			name: 'Hive detail view',
			description: 'Detailed hive workflow with sections, frames, inspections, and metrics.',
			shortcuts: [
				{ keys: 'Shift + ?', action: 'Open AI Advisor' },
				{ keys: 'Esc', action: 'Close AI Advisor drawer' },
				{ keys: 'E', action: 'Edit hive main info' },
				{ keys: 'Tab / Shift + Tab', action: 'Move focus across controls' },
				{ keys: 'Enter', action: 'Confirm focused dialog action' },
			],
		}
	}

	if (isHiveListView) {
		return {
			name: 'Hive list view',
			description: 'Apiary overview with list and table hive navigation modes.',
			shortcuts: [
				{ keys: 'Shift + ?', action: 'Open AI Advisor' },
				{ keys: 'Esc', action: 'Close AI Advisor drawer' },
				{ keys: 'Tab / Shift + Tab', action: 'Move focus across page controls' },
				{ keys: 'Arrow keys', action: 'Move hive focus in list/table view' },
			],
		}
	}

	return {
		name: 'Current view',
		description: 'Page-level context and shortcuts are available here.',
		shortcuts: [
			{ keys: 'Shift + ?', action: 'Open AI Advisor' },
			{ keys: 'Esc', action: 'Close AI Advisor drawer' },
			{ keys: 'Tab / Shift + Tab', action: 'Move focus across page controls' },
		],
	}
}

function renderShortcutsHtml(shortcuts: ViewContext['shortcuts']) {
	const items = shortcuts
		.map((item) => `<li><strong>${item.keys}</strong> - ${item.action}</li>`)
		.join('')
	return `<div><strong>Keyboard shortcuts:</strong><ul>${items}</ul></div>`
}

export default function AIAdvisorDrawer() {
	const location = useLocation()
	const navigate = useNavigate()
	const runRef = useRef(0)
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [billingLocked, setBillingLocked] = useState(false)
	const [generateAdvice] = useMutation(GENERATE_ADVICE_MUTATION)

	const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
	const isOpen = searchParams.get('aiAdvisor') === '1'
	const hiveContext = useMemo(() => getHiveContext(location.pathname), [location.pathname])
	const viewContext = useMemo(() => getViewContext(location.pathname), [location.pathname])
	const shouldRender = isOpen

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
		if (!shouldRender) {
			return
		}

		const runId = Date.now()
		runRef.current = runId
		setBillingLocked(false)
		setMessages([
			{
				id: buildId('view'),
				role: 'system',
				html: `<div><strong>Current view:</strong> ${viewContext.name}<br/>${viewContext.description}</div>`,
			},
			{
				id: buildId('shortcuts'),
				role: 'system',
				html: renderShortcutsHtml(viewContext.shortcuts),
			},
		])

		const run = async () => {
			try {
				const user = await getUser()
				if (runRef.current !== runId) return

				if (!canUseAIAdvisor(user?.billingPlan)) {
					setBillingLocked(true)
					return
				}

				if (!hiveContext) {
					addMessage({
						id: buildId('context'),
						role: 'system',
						text: 'Open a hive detail page to run hive-specific AI analysis.',
					})
					return
				}

				const hiveStepId = buildId('step')
				addMessage({ id: hiveStepId, role: 'system', text: 'Loading hive information...', loading: true })

				const [apiary, hive, family, boxes] = await Promise.all([
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
		}, [hiveContext, shouldRender, viewContext, generateAdvice])

	useEffect(() => {
		if (!shouldRender) {
			return
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape') return
			event.preventDefault()
			closeDrawer()
		}

		document.addEventListener('keydown', onKeyDown, true)
		return () => document.removeEventListener('keydown', onKeyDown, true)
	}, [shouldRender, location.pathname, location.search])

	if (!shouldRender) {
		return null
	}

	return (
		<div className={styles.drawer}>
			<div className={styles.header}>
				<img className={styles.avatar} src={beekeeperURL} alt="AI Advisor avatar" />
				<div className={styles.headerText}>
					<h3 className={styles.title}>AI Advisor</h3>
					<p className={styles.subtitle}>{viewContext.name}</p>
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
				{billingLocked && <AIAdvisorBillingNotice compact />}
			</div>
		</div>
	)
}
