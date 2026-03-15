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
import T, { useTranslation as t } from '@/shared/translate'
import { isBillingTierAtLeast } from '@/shared/billingTier'

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

type DrawerTranslations = {
	hiveDetailViewName: string
	hiveDetailViewDescription: string
	hiveListViewName: string
	hiveListViewDescription: string
	currentViewName: string
	currentViewDescription: string
	shortcutsActionOpenAdvisor: string
	shortcutsActionToggleLeftMenu: string
	shortcutsActionGoToLeftMenuItemByNumber: string
	shortcutsActionCloseDrawer: string
	shortcutsActionGoToApiaryView: string
	shortcutsActionGoToHiveListView: string
	shortcutsActionEditHiveMainInfo: string
	shortcutsActionMoveFocusAcrossControls: string
	shortcutsActionConfirmFocusedDialogAction: string
	shortcutsActionMoveFocusAcrossPageControls: string
	shortcutsActionMoveHiveFocusInListTable: string
	shortcutsActionSwitchSelectedHiveFrames: string
	shortcutsActionSwitchSelectedHiveSections: string
	shortcutsActionDeleteSelectedHiveFrame: string
	shortcutsActionDeleteSelectedHiveSection: string
}

function canUseAIAdvisor(plan?: string | null) {
	return isBillingTierAtLeast(plan, 'starter')
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

function getViewContext(pathname: string, labels: DrawerTranslations): ViewContext {
	const isHiveDetailView = /^\/apiaries\/\d+\/hives\/\d+(?:\/|$)/.test(pathname)
	const isHiveListView = pathname === '/' || pathname === '/apiaries' || pathname === '/apiaries/'

	if (isHiveDetailView) {
		return {
			name: labels.hiveDetailViewName,
			description: labels.hiveDetailViewDescription,
				shortcuts: [
					{ keys: 'Shift + ?', action: labels.shortcutsActionOpenAdvisor },
					{ keys: 'M', action: labels.shortcutsActionToggleLeftMenu },
					{ keys: '1-9 / 0', action: labels.shortcutsActionGoToLeftMenuItemByNumber },
					{ keys: 'Esc', action: labels.shortcutsActionCloseDrawer },
					{ keys: 'A', action: labels.shortcutsActionGoToApiaryView },
					{ keys: 'H', action: labels.shortcutsActionGoToHiveListView },
					{ keys: 'E', action: labels.shortcutsActionEditHiveMainInfo },
					{ keys: 'Arrow Left / Arrow Right', action: labels.shortcutsActionSwitchSelectedHiveFrames },
					{ keys: 'Arrow Up / Arrow Down', action: labels.shortcutsActionSwitchSelectedHiveSections },
					{ keys: 'Backspace', action: labels.shortcutsActionDeleteSelectedHiveSection },
					{ keys: 'Del', action: labels.shortcutsActionDeleteSelectedHiveFrame },
					{ keys: 'Tab / Shift + Tab', action: labels.shortcutsActionMoveFocusAcrossControls },
					{ keys: 'Enter', action: labels.shortcutsActionConfirmFocusedDialogAction },
				],
			}
	}

	if (isHiveListView) {
		return {
			name: labels.hiveListViewName,
			description: labels.hiveListViewDescription,
			shortcuts: [
				{ keys: 'Shift + ?', action: labels.shortcutsActionOpenAdvisor },
				{ keys: 'M', action: labels.shortcutsActionToggleLeftMenu },
				{ keys: '1-9 / 0', action: labels.shortcutsActionGoToLeftMenuItemByNumber },
				{ keys: 'Esc', action: labels.shortcutsActionCloseDrawer },
				{ keys: 'Tab / Shift + Tab', action: labels.shortcutsActionMoveFocusAcrossPageControls },
				{ keys: 'Arrow keys', action: labels.shortcutsActionMoveHiveFocusInListTable },
			],
		}
	}

	return {
		name: labels.currentViewName,
		description: labels.currentViewDescription,
		shortcuts: [
			{ keys: 'Shift + ?', action: labels.shortcutsActionOpenAdvisor },
			{ keys: 'M', action: labels.shortcutsActionToggleLeftMenu },
			{ keys: '1-9 / 0', action: labels.shortcutsActionGoToLeftMenuItemByNumber },
			{ keys: 'Esc', action: labels.shortcutsActionCloseDrawer },
			{ keys: 'Tab / Shift + Tab', action: labels.shortcutsActionMoveFocusAcrossPageControls },
		],
	}
}

function renderShortcutsHtml(shortcuts: ViewContext['shortcuts'], keyboardShortcutsLabel: string) {
	const items = shortcuts
		.map((item) => `<li><strong>${item.keys}</strong> - ${item.action}</li>`)
		.join('')
	return `<div><strong>${keyboardShortcutsLabel}:</strong><ul>${items}</ul></div>`
}

export default function AIAdvisorDrawer() {
	const currentViewLabel = t('Current view')
	const keyboardShortcutsLabel = t('Keyboard shortcuts')
	const hiveDetailViewName = t('Hive detail view')
	const hiveDetailViewDescription = t('Detailed hive workflow with sections, frames, inspections, and metrics.')
	const hiveListViewName = t('Hive list view')
	const hiveListViewDescription = t('Apiary overview with list and table hive navigation modes.')
	const currentViewName = t('Current view')
	const currentViewDescription = t('Page-level context and shortcuts are available here.')
	const shortcutsActionOpenAdvisor = t('Open AI Advisor')
	const shortcutsActionToggleLeftMenu = t('Toggle left menu')
	const shortcutsActionGoToLeftMenuItemByNumber = t('Go to left menu item by number')
	const shortcutsActionCloseDrawer = t('Close AI Advisor drawer')
	const shortcutsActionGoToApiaryView = t('Go to apiary view')
	const shortcutsActionGoToHiveListView = t('Go to hive list view')
	const shortcutsActionEditHiveMainInfo = t('Edit hive main info')
	const shortcutsActionMoveFocusAcrossControls = t('Move focus across controls')
	const shortcutsActionConfirmFocusedDialogAction = t('Confirm focused dialog action')
	const shortcutsActionMoveFocusAcrossPageControls = t('Move focus across page controls')
	const shortcutsActionMoveHiveFocusInListTable = t('Move hive focus in list/table view')
	const shortcutsActionSwitchSelectedHiveFrames = t('Switch selected hive frames')
	const shortcutsActionSwitchSelectedHiveSections = t('Switch selected hive sections')
	const shortcutsActionDeleteSelectedHiveFrame = t('Delete selected hive frame')
	const shortcutsActionDeleteSelectedHiveSection = t('Delete selected hive section')
	const openHiveDetailMessage = t('Open a hive detail page to run hive-specific AI analysis.')
	const loadingHiveInfoMessage = t('Loading hive information...')
	const loadedHiveInfoMessage = t('Loaded hive information')
	const boxesLabel = t('boxes')
	const loadingPastInspectionsMessage = t('Loading past inspections...')
	const loadedPastInspectionsMessage = t('Loaded past inspections')
	const loadingMetricsMessage = t('Loading metrics...')
	const loadedRecentTelemetryMetricsMessage = t('Loaded recent telemetry metrics.')
	const sendingContextMessage = t('Sending context to AI Advisor for summarization...')
	const summaryGeneratedMessage = t('Summary generated.')
	const summaryUnavailableMessage = t('AI Advisor did not return a summary yet. Backend endpoint may still be unavailable.')
	const failedAdvisoryMessage = t('Failed to complete AI advisory run. Please try again in a moment.')
	const closeAiAdvisorLabel = t('Close AI Advisor')
	const aiAdvisorAvatarAlt = t('AI Advisor avatar')

	const location = useLocation()
	const navigate = useNavigate()
	const runRef = useRef(0)
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [billingLocked, setBillingLocked] = useState(false)
	const [generateAdvice] = useMutation(GENERATE_ADVICE_MUTATION)

	const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
	const isOpen = searchParams.get('aiAdvisor') === '1'
	const hiveContext = useMemo(() => getHiveContext(location.pathname), [location.pathname])
	const viewContext = useMemo(
		() =>
			getViewContext(location.pathname, {
				hiveDetailViewName,
				hiveDetailViewDescription,
				hiveListViewName,
				hiveListViewDescription,
					currentViewName,
					currentViewDescription,
					shortcutsActionOpenAdvisor,
					shortcutsActionToggleLeftMenu,
					shortcutsActionGoToLeftMenuItemByNumber,
					shortcutsActionCloseDrawer,
					shortcutsActionGoToApiaryView,
					shortcutsActionGoToHiveListView,
					shortcutsActionEditHiveMainInfo,
					shortcutsActionMoveFocusAcrossControls,
					shortcutsActionConfirmFocusedDialogAction,
					shortcutsActionMoveFocusAcrossPageControls,
					shortcutsActionMoveHiveFocusInListTable,
					shortcutsActionSwitchSelectedHiveFrames,
					shortcutsActionSwitchSelectedHiveSections,
					shortcutsActionDeleteSelectedHiveFrame,
					shortcutsActionDeleteSelectedHiveSection,
				}),
		[
			location.pathname,
			hiveDetailViewName,
			hiveDetailViewDescription,
			hiveListViewName,
			hiveListViewDescription,
			currentViewName,
			currentViewDescription,
			shortcutsActionOpenAdvisor,
			shortcutsActionToggleLeftMenu,
			shortcutsActionGoToLeftMenuItemByNumber,
			shortcutsActionCloseDrawer,
			shortcutsActionGoToApiaryView,
			shortcutsActionGoToHiveListView,
			shortcutsActionEditHiveMainInfo,
			shortcutsActionMoveFocusAcrossControls,
			shortcutsActionConfirmFocusedDialogAction,
			shortcutsActionMoveFocusAcrossPageControls,
			shortcutsActionMoveHiveFocusInListTable,
			shortcutsActionSwitchSelectedHiveFrames,
			shortcutsActionSwitchSelectedHiveSections,
			shortcutsActionDeleteSelectedHiveFrame,
			shortcutsActionDeleteSelectedHiveSection,
		]
	)
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
				html: `<div><strong>${currentViewLabel}:</strong> ${viewContext.name}<br/>${viewContext.description}</div>`,
			},
			{
				id: buildId('shortcuts'),
				role: 'system',
				html: renderShortcutsHtml(viewContext.shortcuts, keyboardShortcutsLabel),
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
						text: openHiveDetailMessage,
					})
					return
				}

				const hiveStepId = buildId('step')
				addMessage({ id: hiveStepId, role: 'system', text: loadingHiveInfoMessage, loading: true })

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
					text: `${loadedHiveInfoMessage} (${boxes.length} ${boxesLabel}).`,
					loading: false,
				})

				const inspectionsStepId = buildId('step')
				addMessage({ id: inspectionsStepId, role: 'system', text: loadingPastInspectionsMessage, loading: true })
				const inspections = await listInspections(hiveContext.hiveId)

				if (runRef.current !== runId) return
				updateMessage(inspectionsStepId, {
					text: `${loadedPastInspectionsMessage} (${inspections.length}).`,
					loading: false,
				})

				const metricsStepId = buildId('step')
				addMessage({ id: metricsStepId, role: 'system', text: loadingMetricsMessage, loading: true })

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
					text: loadedRecentTelemetryMetricsMessage,
					loading: false,
				})

				const summarizeStepId = buildId('step')
				addMessage({
					id: summarizeStepId,
					role: 'system',
					text: sendingContextMessage,
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
					text: summaryGeneratedMessage,
					loading: false,
				})

				const adviceHtml = response?.data?.generateHiveAdvice
				if (adviceHtml) {
					addMessage({ id: buildId('reply'), role: 'assistant', html: adviceHtml })
				} else {
					addMessage({
						id: buildId('reply'),
						role: 'error',
						text: summaryUnavailableMessage,
					})
				}
			} catch (error) {
				if (runRef.current !== runId) return
				addMessage({
					id: buildId('error'),
					role: 'error',
					text: failedAdvisoryMessage,
				})
			}
		}

		run()

			return () => {
				runRef.current = 0
			}
		}, [
			hiveContext,
			shouldRender,
			viewContext,
			generateAdvice,
			currentViewLabel,
			keyboardShortcutsLabel,
			openHiveDetailMessage,
			loadingHiveInfoMessage,
			loadedHiveInfoMessage,
			boxesLabel,
			loadingPastInspectionsMessage,
			loadedPastInspectionsMessage,
			loadingMetricsMessage,
			loadedRecentTelemetryMetricsMessage,
			sendingContextMessage,
			summaryGeneratedMessage,
			summaryUnavailableMessage,
			failedAdvisoryMessage,
		])

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
				<img className={styles.avatar} src={beekeeperURL} alt={aiAdvisorAvatarAlt} />
				<div className={styles.headerText}>
					<h3 className={styles.title}><T>AI Advisor</T></h3>
					<p className={styles.subtitle}>{viewContext.name}</p>
					</div>
				<button className={styles.closeBtn} type="button" onClick={closeDrawer} aria-label={closeAiAdvisorLabel}>
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
