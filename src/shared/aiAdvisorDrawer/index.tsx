import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { apiClient, gql, useMutation } from '@/api'
import { getApiary } from '@/models/apiary'
import { getHive } from '@/models/hive'
import { getFamilyByHive } from '@/models/family'
import { getBoxes } from '@/models/boxes'
import { getFrames } from '@/models/frames'
import { getFrameSideCells } from '@/models/frameSideCells'
import { getFrameSideFile, getFrameSidePreviewImage } from '@/models/frameSideFile'
import { getUser } from '@/models/user'
import { listInspections } from '@/models/inspections'
import { listHiveLogs, syncHiveLogsFromBackend } from '@/models/hiveLog'

import beekeeperURL from '@/assets/beekeeper.png'
import styles from './styles.module.less'
import AIAdvisorBillingNotice from '@/shared/aiAdvisorBillingNotice'
import KeyboardHints from '@/shared/keyboardHints'
import T, { useTranslation as t } from '@/shared/translate'
import { isBillingTierAtLeast } from '@/shared/billingTier'

type ChatMessage = {
	id: string
	role: 'assistant' | 'system' | 'error' | 'user'
	text?: string
	html?: string
	payloadOverview?: Record<string, any>
	shortcuts?: ViewContext['shortcuts']
	shortcutsTitle?: string
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
	apiaryOverviewViewName: string
	apiaryOverviewViewDescription: string
	frameViewName: string
	frameViewDescription: string
	canvasEditViewName: string
	canvasEditViewDescription: string
	hiveListViewName: string
	hiveListViewDescription: string
	warehouseQueenListViewName: string
	warehouseQueenListViewDescription: string
	deviceListViewName: string
	deviceListViewDescription: string
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
	shortcutsActionMoveQueenFocusInTable: string
	shortcutsActionMoveDeviceFocusInList: string
	shortcutsActionSwitchSelectedHiveFrames: string
	shortcutsActionSwitchSelectedHiveSections: string
	shortcutsActionDeleteSelectedHiveFrame: string
	shortcutsActionDeleteSelectedHiveSection: string
	shortcutsActionDeleteSelectedWarehouseQueen: string
	shortcutsActionDeleteSelectedDevice: string
	shortcutsActionCancelFocusedDialogAction: string
	shortcutsActionSwitchToCellBrush: string
	shortcutsActionSwitchToFreeDraw: string
	shortcutsActionSwitchToCellEraser: string
	shortcutsActionSetCellTypeNectar: string
	shortcutsActionSetCellTypeHoney: string
	shortcutsActionSetCellTypePollen: string
	shortcutsActionSetCellTypeEggs: string
	shortcutsActionSetCellTypeBrood: string
	shortcutsActionSetCellTypeCappedBrood: string
	shortcutsActionSetCellTypeDroneBrood: string
	shortcutsActionSetCellTypeEmpty: string
	shortcutsActionIncreaseBrushSize: string
	shortcutsActionDecreaseBrushSize: string
	shortcutsActionUndoStroke: string
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

const APIARY_ADVISOR_QUERY = gql`
	query advisorApiary($id: ID!) {
		apiary(id: $id) {
			id
			name
			type
			lat
			lng
			hives {
				id
				hiveNumber
				boxCount
				family {
					name
				}
			}
		}
	}
`

const APIARY_PLACEMENT_QUERY = gql`
	query advisorApiaryPlacement($apiaryId: ID!) {
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
`

const APIARY_WEATHER_QUERY = gql`
	query advisorApiaryWeather($lat: String!, $lng: String!) {
		weather(lat: $lat, lng: $lng)
	}
`

const FRAME_SIDE_IMAGE_QUERY = gql`
	query advisorFrameImage($frameSideId: ID!) {
		hiveFrameSideFile(frameSideId: $frameSideId) {
			frameSideId
			file {
				id
				url
				resizes {
					max_dimension_px
					url
				}
			}
		}
	}
`

const AI_ADVISOR_USAGE_QUERY = gql`
	query aiAdvisorUsage {
		aiAdvisorUsage {
			month
			inputTokensUsed
			outputTokensUsed
			totalTokensUsed
			requestCount
			inputTokensLimit
			outputTokensLimit
			inputUsagePercent
			outputUsagePercent
			percentUsed
		}
	}
`

function buildId(prefix: string) {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

type FrameRouteContext = {
	boxId: number
	frameId: number
	frameSideId: number | null
	isCanvasEdit: boolean
}

type ApiaryRouteContext = {
	apiaryId: number
}

function getHiveContext(pathname: string) {
	const matches = pathname.match(/^\/apiaries\/(\d+)\/hives\/(\d+)(?:\/|$)/)
	if (!matches) return null
	return {
		apiaryId: +matches[1],
		hiveId: +matches[2],
	}
}

function getFrameRouteContext(pathname: string): FrameRouteContext | null {
	const matches = pathname.match(
		/^\/apiaries\/\d+\/hives\/\d+\/box\/(\d+)\/frame\/(\d+)(?:\/(\d+))?(\/canvas-edit)?(?:\/|$)/
	)
	if (!matches) return null
	return {
		boxId: +matches[1],
		frameId: +matches[2],
		frameSideId: matches[3] ? +matches[3] : null,
		isCanvasEdit: Boolean(matches[4]),
	}
}

function getApiaryOverviewContext(pathname: string): ApiaryRouteContext | null {
	const matches = pathname.match(/^\/apiaries\/(\d+)\/?$/)
	if (!matches) return null
	return {
		apiaryId: +matches[1],
	}
}

function normalizeDegrees(value: number) {
	const out = value % 360
	return out < 0 ? out + 360 : out
}

function angularDelta(a: number, b: number) {
	const delta = Math.abs(normalizeDegrees(a) - normalizeDegrees(b))
	return Math.min(delta, 360 - delta)
}

function distance2d(x1: number, y1: number, x2: number, y2: number) {
	return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

function truncateText(value: any, max = 500) {
	if (typeof value !== 'string') return value
	return value.length > max ? `${value.slice(0, max)}...` : value
}

function compactCellSummary(cells: any) {
	if (!cells || typeof cells !== 'object') return null
	return {
		broodPercent: cells.broodPercent ?? 0,
		cappedBroodPercent: cells.cappedBroodPercent ?? 0,
		eggsPercent: cells.eggsPercent ?? 0,
		nectarPercent: cells.nectarPercent ?? 0,
		honeyPercent: cells.honeyPercent ?? 0,
		pollenPercent: cells.pollenPercent ?? 0,
		droneBroodPercent: cells.droneBroodPercent ?? 0,
	}
}

function pickOptimizedImage(file?: any) {
	if (!file) return null
	const resizes = Array.isArray(file?.resizes) ? [...file.resizes] : []
	if (!resizes.length) {
		return {
			url: file?.url || null,
			maxDimensionPx: null,
			source: file?.url ? 'original' : null,
		}
	}

	resizes.sort((a, b) => (a?.max_dimension_px || 0) - (b?.max_dimension_px || 0))
	const preferred = resizes.find((resize) => (resize?.max_dimension_px || 0) >= 512) || resizes[resizes.length - 1]
	return {
		url: preferred?.url || file?.url || null,
		maxDimensionPx: preferred?.max_dimension_px || null,
		source: preferred?.url ? 'resize' : 'original',
	}
}

function pruneForPreview(value: any, depth = 0): any {
	if (value === null || value === undefined) return value
	if (depth > 4) return '[truncated]'
	if (typeof value === 'string') return value.slice(0, 200)
	if (typeof value === 'number' || typeof value === 'boolean') return value

	if (Array.isArray(value)) {
		return value.slice(0, 5).map((entry) => pruneForPreview(entry, depth + 1))
	}

	if (typeof value === 'object') {
		const keys = Object.keys(value).slice(0, 12)
		const out = {}
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i]
			out[key] = pruneForPreview(value[key], depth + 1)
		}
		return out
	}

	return String(value)
}

function findSelectedFramePayload(
	framesByBox: Record<string, any>,
	frameRouteContext: FrameRouteContext | null
) {
	if (!frameRouteContext) return null

	const framesInBox = Object.values(framesByBox[String(frameRouteContext.boxId)] || {})
	const selectedFrame = framesInBox.find((frame: any) => +frame?.id === frameRouteContext.frameId)

	if (!selectedFrame) return null

	return pruneForPreview(selectedFrame)
}

function findSelectedFrameRaw(
	framesByBox: Record<string, any>,
	frameRouteContext: FrameRouteContext | null
) {
	if (!frameRouteContext) return null
	const framesInBox = Object.values(framesByBox[String(frameRouteContext.boxId)] || {})
	return framesInBox.find((frame: any) => +frame?.id === frameRouteContext.frameId) || null
}

function getViewContext(pathname: string, labels: DrawerTranslations): ViewContext {
	const isHiveDetailView = /^\/apiaries\/\d+\/hives\/\d+(?:\/|$)/.test(pathname)
	const isApiaryOverviewView = /^\/apiaries\/\d+\/?$/.test(pathname)
	const isFrameView = /^\/apiaries\/\d+\/hives\/\d+\/box\/\d+\/frame\/\d+(?:\/\d+)?\/?$/.test(pathname)
	const isCanvasEditView = /^\/apiaries\/\d+\/hives\/\d+\/box\/\d+\/frame\/\d+\/\d+\/canvas-edit(?:\/|$)/.test(pathname)
	const isHiveListView = pathname === '/' || pathname === '/apiaries' || pathname === '/apiaries/'
	const isWarehouseQueenListView = pathname === '/warehouse/queens' || pathname === '/warehouse/queens/'
	const isDeviceListView = pathname === '/devices' || pathname === '/devices/'

	if (isCanvasEditView) {
		return {
			name: labels.canvasEditViewName,
			description: labels.canvasEditViewDescription,
			shortcuts: [
				{ keys: 'Shift + ?', action: labels.shortcutsActionOpenAdvisor },
				{ keys: 'M', action: labels.shortcutsActionToggleLeftMenu },
				{ keys: '1-9 / 0', action: labels.shortcutsActionGoToLeftMenuItemByNumber },
				{ keys: 'Esc', action: labels.shortcutsActionCloseDrawer },
				{ keys: 'A', action: labels.shortcutsActionGoToApiaryView },
				{ keys: 'H', action: labels.shortcutsActionGoToHiveListView },
				{ keys: 'Arrow Left / Arrow Right', action: labels.shortcutsActionSwitchSelectedHiveFrames },
				{ keys: 'Arrow Up / Arrow Down', action: labels.shortcutsActionSwitchSelectedHiveSections },
				{ keys: 'C', action: labels.shortcutsActionSwitchToCellBrush },
				{ keys: 'F', action: labels.shortcutsActionSwitchToFreeDraw },
				{ keys: 'X', action: labels.shortcutsActionSwitchToCellEraser },
				{ keys: 'N', action: labels.shortcutsActionSetCellTypeNectar },
				{ keys: 'Y', action: labels.shortcutsActionSetCellTypeHoney },
				{ keys: 'P', action: labels.shortcutsActionSetCellTypePollen },
				{ keys: 'G', action: labels.shortcutsActionSetCellTypeEggs },
				{ keys: 'B', action: labels.shortcutsActionSetCellTypeBrood },
				{ keys: 'K', action: labels.shortcutsActionSetCellTypeCappedBrood },
				{ keys: 'D', action: labels.shortcutsActionSetCellTypeDroneBrood },
				{ keys: 'U', action: labels.shortcutsActionSetCellTypeEmpty },
				{ keys: '+ / =', action: labels.shortcutsActionIncreaseBrushSize },
				{ keys: '-', action: labels.shortcutsActionDecreaseBrushSize },
				{ keys: 'Ctrl + Z', action: labels.shortcutsActionUndoStroke },
			],
		}
	}

	if (isFrameView) {
		return {
			name: labels.frameViewName,
			description: labels.frameViewDescription,
			shortcuts: [
				{ keys: 'Shift + ?', action: labels.shortcutsActionOpenAdvisor },
				{ keys: 'M', action: labels.shortcutsActionToggleLeftMenu },
				{ keys: '1-9 / 0', action: labels.shortcutsActionGoToLeftMenuItemByNumber },
				{ keys: 'Esc', action: labels.shortcutsActionCloseDrawer },
				{ keys: 'A', action: labels.shortcutsActionGoToApiaryView },
				{ keys: 'H', action: labels.shortcutsActionGoToHiveListView },
				{ keys: 'Arrow Left / Arrow Right', action: labels.shortcutsActionSwitchSelectedHiveFrames },
				{ keys: 'Arrow Up / Arrow Down', action: labels.shortcutsActionSwitchSelectedHiveSections },
				{ keys: 'Tab / Shift + Tab', action: labels.shortcutsActionMoveFocusAcrossControls },
			],
		}
	}

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

	if (isApiaryOverviewView) {
		return {
			name: labels.apiaryOverviewViewName,
			description: labels.apiaryOverviewViewDescription,
			shortcuts: [
				{ keys: 'Shift + ?', action: labels.shortcutsActionOpenAdvisor },
				{ keys: 'M', action: labels.shortcutsActionToggleLeftMenu },
				{ keys: '1-9 / 0', action: labels.shortcutsActionGoToLeftMenuItemByNumber },
				{ keys: 'Esc', action: labels.shortcutsActionCloseDrawer },
				{ keys: 'H', action: labels.shortcutsActionGoToHiveListView },
				{ keys: 'Tab / Shift + Tab', action: labels.shortcutsActionMoveFocusAcrossPageControls },
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

	if (isWarehouseQueenListView) {
		return {
			name: labels.warehouseQueenListViewName,
			description: labels.warehouseQueenListViewDescription,
			shortcuts: [
				{ keys: 'Shift + ?', action: labels.shortcutsActionOpenAdvisor },
				{ keys: 'M', action: labels.shortcutsActionToggleLeftMenu },
				{ keys: '1-9 / 0', action: labels.shortcutsActionGoToLeftMenuItemByNumber },
				{ keys: 'Esc', action: labels.shortcutsActionCloseDrawer },
				{ keys: 'Arrow Up / Arrow Down', action: labels.shortcutsActionMoveQueenFocusInTable },
				{ keys: 'Del', action: labels.shortcutsActionDeleteSelectedWarehouseQueen },
				{ keys: 'Esc', action: labels.shortcutsActionCancelFocusedDialogAction },
				{ keys: 'Enter', action: labels.shortcutsActionConfirmFocusedDialogAction },
			],
		}
	}

	if (isDeviceListView) {
		return {
			name: labels.deviceListViewName,
			description: labels.deviceListViewDescription,
			shortcuts: [
				{ keys: 'Shift + ?', action: labels.shortcutsActionOpenAdvisor },
				{ keys: 'M', action: labels.shortcutsActionToggleLeftMenu },
				{ keys: '1-9 / 0', action: labels.shortcutsActionGoToLeftMenuItemByNumber },
				{ keys: 'Esc', action: labels.shortcutsActionCloseDrawer },
				{ keys: 'Arrow Up / Arrow Down', action: labels.shortcutsActionMoveDeviceFocusInList },
				{ keys: 'Del', action: labels.shortcutsActionDeleteSelectedDevice },
				{ keys: 'Esc', action: labels.shortcutsActionCancelFocusedDialogAction },
				{ keys: 'Enter', action: labels.shortcutsActionConfirmFocusedDialogAction },
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

function formatShortcutHintKeys(keys: string) {
	if (keys === 'Arrow keys') return '← ↑ → ↓'

	return keys
		.replace(/Arrow Left/g, '←')
		.replace(/Arrow Right/g, '→')
		.replace(/Arrow Up/g, '↑')
		.replace(/Arrow Down/g, '↓')
}

export default function AIAdvisorDrawer() {
	const currentViewLabel = t('Current view')
	const keyboardShortcutsLabel = t('Keyboard shortcuts')
	const hiveDetailViewName = t('Hive detail view')
	const hiveDetailViewDescription = t('Detailed hive workflow with sections, frames, inspections, and metrics.')
	const apiaryOverviewViewName = t('Apiary overview view')
	const apiaryOverviewViewDescription = t('Apiary-level overview with colony list, placement, and local conditions context.')
	const frameViewName = t('Frame view')
	const frameViewDescription = t('Single frame-side view focused on detected cells, bees, queens, and varroa signals.')
	const canvasEditViewName = t('Frame canvas edit view')
	const canvasEditViewDescription = t('Frame-side canvas editor with tool switching, cell brush typing, and brush size controls.')
	const hiveListViewName = t('Hive list view')
	const hiveListViewDescription = t('Apiary overview with list and table hive navigation modes.')
	const warehouseQueenListViewName = t('Warehouse queen list view')
	const warehouseQueenListViewDescription = t('Warehouse queen table with keyboard row selection and deletion flow.')
	const deviceListViewName = t('Device list view')
	const deviceListViewDescription = t('Device list with keyboard row selection and deletion flow.')
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
	const shortcutsActionCancelFocusedDialogAction = t('Cancel focused dialog action')
	const shortcutsActionMoveFocusAcrossPageControls = t('Move focus across page controls')
	const shortcutsActionMoveHiveFocusInListTable = t('Move hive focus in list/table view')
	const shortcutsActionMoveQueenFocusInTable = t('Move queen focus in table view')
	const shortcutsActionMoveDeviceFocusInList = t('Move device focus in list view')
	const shortcutsActionSwitchSelectedHiveFrames = t('Switch selected hive frames')
	const shortcutsActionSwitchSelectedHiveSections = t('Switch selected hive sections')
	const shortcutsActionDeleteSelectedHiveFrame = t('Delete selected hive frame')
	const shortcutsActionDeleteSelectedHiveSection = t('Delete selected hive section')
	const shortcutsActionDeleteSelectedWarehouseQueen = t('Delete selected warehouse queen')
	const shortcutsActionDeleteSelectedDevice = t('Delete selected device')
	const shortcutsActionSwitchToCellBrush = t('Switch to cell brush')
	const shortcutsActionSwitchToFreeDraw = t('Switch to free draw')
	const shortcutsActionSwitchToCellEraser = t('Switch to cell eraser')
	const shortcutsActionSetCellTypeNectar = t('Set cell type to nectar')
	const shortcutsActionSetCellTypeHoney = t('Set cell type to honey')
	const shortcutsActionSetCellTypePollen = t('Set cell type to pollen')
	const shortcutsActionSetCellTypeEggs = t('Set cell type to eggs')
	const shortcutsActionSetCellTypeBrood = t('Set cell type to brood')
	const shortcutsActionSetCellTypeCappedBrood = t('Set cell type to capped brood')
	const shortcutsActionSetCellTypeDroneBrood = t('Set cell type to drone brood')
	const shortcutsActionSetCellTypeEmpty = t('Set cell type to empty')
	const shortcutsActionIncreaseBrushSize = t('Increase brush size')
	const shortcutsActionDecreaseBrushSize = t('Decrease brush size')
	const shortcutsActionUndoStroke = t('Undo stroke')
	const openHiveDetailMessage = t('Open a hive detail page or apiary overview page to run AI analysis.')
	const advisorThinkingMessage = t('AI Advisor is thinking...')
	const summaryUnavailableMessage = t('AI Advisor did not return a summary yet. Backend endpoint may still be unavailable.')
	const failedAdvisoryMessage = t('Failed to complete AI advisory run. Please try again in a moment.')
	const askAdvisorPlaceholder = t('Ask AI Advisor about this hive...')
	const sendButtonLabel = t('Send')
	const closeAiAdvisorLabel = t('Close AI Advisor')
	const aiAdvisorAvatarAlt = t('AI Advisor avatar')
	const aiUsageRemainingLabel = 'AI remaining'
	const aiUsageUnavailableLabel = 'unavailable'

	const location = useLocation()
	const navigate = useNavigate()
	const runRef = useRef(0)
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [draftMessage, setDraftMessage] = useState('')
	const [isSendingUserMessage, setIsSendingUserMessage] = useState(false)
	const [adviceContext, setAdviceContext] = useState<any | null>(null)
	const [advisorTargetHiveID, setAdvisorTargetHiveID] = useState<number | undefined>(undefined)
	const [advisorLangCode, setAdvisorLangCode] = useState<string | undefined>(undefined)
	const [billingLocked, setBillingLocked] = useState(false)
	const [usageLoading, setUsageLoading] = useState(false)
	const [aiUsage, setAiUsage] = useState<any | null>(null)
	const [generateAdvice] = useMutation(GENERATE_ADVICE_MUTATION)

	const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
	const isOpen = searchParams.get('aiAdvisor') === '1'
	const hiveContext = useMemo(() => getHiveContext(location.pathname), [location.pathname])
	const apiaryOverviewContext = useMemo(() => getApiaryOverviewContext(location.pathname), [location.pathname])
	const frameRouteContext = useMemo(() => getFrameRouteContext(location.pathname), [location.pathname])
	const viewContext = useMemo(
		() =>
			getViewContext(location.pathname, {
				hiveDetailViewName,
				hiveDetailViewDescription,
				apiaryOverviewViewName,
				apiaryOverviewViewDescription,
				frameViewName,
				frameViewDescription,
				canvasEditViewName,
				canvasEditViewDescription,
					hiveListViewName,
					hiveListViewDescription,
					warehouseQueenListViewName,
					warehouseQueenListViewDescription,
					deviceListViewName,
					deviceListViewDescription,
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
					shortcutsActionCancelFocusedDialogAction,
						shortcutsActionMoveFocusAcrossPageControls,
						shortcutsActionMoveHiveFocusInListTable,
						shortcutsActionMoveQueenFocusInTable,
						shortcutsActionMoveDeviceFocusInList,
						shortcutsActionSwitchSelectedHiveFrames,
						shortcutsActionSwitchSelectedHiveSections,
						shortcutsActionDeleteSelectedHiveFrame,
						shortcutsActionDeleteSelectedHiveSection,
						shortcutsActionDeleteSelectedWarehouseQueen,
						shortcutsActionDeleteSelectedDevice,
						shortcutsActionSwitchToCellBrush,
						shortcutsActionSwitchToFreeDraw,
						shortcutsActionSwitchToCellEraser,
						shortcutsActionSetCellTypeNectar,
						shortcutsActionSetCellTypeHoney,
						shortcutsActionSetCellTypePollen,
						shortcutsActionSetCellTypeEggs,
						shortcutsActionSetCellTypeBrood,
						shortcutsActionSetCellTypeCappedBrood,
						shortcutsActionSetCellTypeDroneBrood,
						shortcutsActionSetCellTypeEmpty,
						shortcutsActionIncreaseBrushSize,
						shortcutsActionDecreaseBrushSize,
						shortcutsActionUndoStroke,
					}),
		[
			location.pathname,
			hiveDetailViewName,
			hiveDetailViewDescription,
			apiaryOverviewViewName,
			apiaryOverviewViewDescription,
			frameViewName,
			frameViewDescription,
			canvasEditViewName,
			canvasEditViewDescription,
			hiveListViewName,
			hiveListViewDescription,
			warehouseQueenListViewName,
			warehouseQueenListViewDescription,
			deviceListViewName,
			deviceListViewDescription,
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
			shortcutsActionCancelFocusedDialogAction,
			shortcutsActionMoveFocusAcrossPageControls,
			shortcutsActionMoveHiveFocusInListTable,
			shortcutsActionMoveQueenFocusInTable,
			shortcutsActionMoveDeviceFocusInList,
			shortcutsActionSwitchSelectedHiveFrames,
			shortcutsActionSwitchSelectedHiveSections,
			shortcutsActionDeleteSelectedHiveFrame,
			shortcutsActionDeleteSelectedHiveSection,
			shortcutsActionDeleteSelectedWarehouseQueen,
			shortcutsActionDeleteSelectedDevice,
			shortcutsActionSwitchToCellBrush,
			shortcutsActionSwitchToFreeDraw,
			shortcutsActionSwitchToCellEraser,
			shortcutsActionSetCellTypeNectar,
			shortcutsActionSetCellTypeHoney,
			shortcutsActionSetCellTypePollen,
			shortcutsActionSetCellTypeEggs,
			shortcutsActionSetCellTypeBrood,
			shortcutsActionSetCellTypeCappedBrood,
			shortcutsActionSetCellTypeDroneBrood,
			shortcutsActionSetCellTypeEmpty,
			shortcutsActionIncreaseBrushSize,
			shortcutsActionDecreaseBrushSize,
			shortcutsActionUndoStroke,
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

	function removeMessage(id: string) {
		setMessages((prev) => prev.filter((msg) => msg.id !== id))
	}

	const fetchAiUsage = useCallback(async () => {
		try {
			setUsageLoading(true)
			const usageResult = await apiClient.query(AI_ADVISOR_USAGE_QUERY, {}).toPromise()
			setAiUsage(usageResult?.data?.aiAdvisorUsage || null)
		} catch {
			setAiUsage(null)
		} finally {
			setUsageLoading(false)
		}
	}, [])

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
				html: `<div><strong>${currentViewLabel}:</strong> ${viewContext.name}<br/>${viewContext.description}</div>`,
			},
			{
				id: buildId('shortcuts'),
				role: 'system',
				shortcuts: viewContext.shortcuts,
				shortcutsTitle: keyboardShortcutsLabel,
			},
		])

		const run = async () => {
			let pendingReplyId: string | null = null
			try {
				const user = await getUser()
				setAdvisorLangCode(user?.lang)
				if (runRef.current !== runId) return

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
							text: openHiveDetailMessage,
						})
						return
					}
					if (apiaryOverviewContext && !hiveContext) {
						const localApiary = await getApiary(apiaryOverviewContext.apiaryId)
						const apiaryResult = await apiClient
							.query(APIARY_ADVISOR_QUERY, { id: apiaryOverviewContext.apiaryId })
							.toPromise()
						const placementResult = await apiClient
							.query(APIARY_PLACEMENT_QUERY, { apiaryId: apiaryOverviewContext.apiaryId })
							.toPromise()

						if (runRef.current !== runId) return

						const apiary = apiaryResult?.data?.apiary || localApiary || null
						const hives = Array.isArray(apiary?.hives) ? apiary.hives : []
						const placements = placementResult?.data?.hivePlacements || []
						const obstacles = placementResult?.data?.apiaryObstacles || []
						const lat = Number(apiary?.lat || 0)
						const lng = Number(apiary?.lng || 0)
						const hasCoordinates = !!lat && !!lng && !Number.isNaN(lat) && !Number.isNaN(lng)

						let weatherPayload = null
						if (hasCoordinates) {
							const weatherResult = await apiClient
								.query(APIARY_WEATHER_QUERY, { lat: `${lat}`, lng: `${lng}` })
								.toPromise()
							weatherPayload = weatherResult?.data?.weather || null
						}

						if (runRef.current !== runId) return

						const weather = {
							temperature: weatherPayload?.current_weather?.temperature ?? null,
							windSpeed: weatherPayload?.current_weather?.windspeed ?? null,
							windDirection:
								weatherPayload?.current_weather?.winddirection
								?? weatherPayload?.current?.wind_direction_10m
								?? weatherPayload?.hourly?.winddirection_10m?.[0]
								?? null,
							rain: weatherPayload?.current?.precipitation ?? weatherPayload?.hourly?.rain?.[0] ?? null,
							pressure:
								weatherPayload?.current?.surface_pressure
								?? weatherPayload?.current?.pressure_msl
								?? weatherPayload?.hourly?.surface_pressure?.[0]
								?? weatherPayload?.hourly?.pressure_msl?.[0]
								?? null,
							elevation: weatherPayload?.elevation ?? null,
						}

						const hivePlacements = hives.map((hive: any) => {
							const placement = placements.find((entry: any) => String(entry?.hiveId) === String(hive?.id))
							const nearbyObstacles = placement
								? obstacles
									.map((obstacle: any) => {
										const obstacleDistance = distance2d(
											Number(placement.x),
											Number(placement.y),
											Number(obstacle?.x || 0),
											Number(obstacle?.y || 0)
										)
										const obstacleKind = obstacle?.type === 'CIRCLE' ? 'tree' : 'building'
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
									: Math.round(angularDelta(+facingDirectionDeg, +windDirectionDeg))

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
							text: advisorThinkingMessage,
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
							addMessage({ id: buildId('reply'), role: 'assistant', html: adviceHtml })
						} else {
							removeMessage(pendingReplyId)
							addMessage({
								id: buildId('reply'),
								role: 'error',
								text: summaryUnavailableMessage,
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

				if (runRef.current !== runId) return

				const framesByBox = {}
				for (let i in boxes) {
					const frames = Object.assign({}, await getFrames({ boxId: +boxes[i].id }))
					delete boxes[i].color

					for (let j in frames) {
						if (!frames[j].leftSide || !frames[j].rightSide) continue

						;(frames[j].leftSide as any).cells = compactCellSummary(await getFrameSideCells(+frames[j].leftId))
						;(frames[j].rightSide as any).cells = compactCellSummary(await getFrameSideCells(+frames[j].rightId))
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
							.query(FRAME_SIDE_IMAGE_QUERY, { frameSideId: frameRouteContext.frameSideId })
							.toPromise()
						let frameFile = frameImageResult?.data?.hiveFrameSideFile?.file
						if (!frameFile) {
							// Fallback to local cache (Dexie) when backend query is temporarily missing.
							frameFile = await getFrameSidePreviewImage(frameRouteContext.frameSideId as number)
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

					const selectedFrameRaw = findSelectedFrameRaw(framesByBox, frameRouteContext)
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
					boxes,
					frames: framesForAdvice,
					inspections: inspections.slice(0, 40),
					changeHistory: changeHistory.map((entry) => ({
						id: entry.id,
						action: entry.action,
						title: entry.title,
						details: truncateText(entry.details, 500),
						source: entry.source,
						createdAt: entry.createdAt,
						relatedHives: entry.relatedHives || [],
					})).slice(0, 60),
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
					const selectedFramePayload = findSelectedFramePayload(framesByBox, frameRouteContext)
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
							boxes: boxes.length,
							inspections: inspections.length,
							changeHistoryEntries: changeHistory.length,
							frames: Object.values(framesByBox).reduce(
								(total: number, byBox: any) => total + Object.keys(byBox || {}).length,
								0
						),
					},
					selectedFrame: selectedFramePayload,
						metricsSummary: {
							weightPoints: metricsResult?.data?.weightKg?.metrics?.length || 0,
							temperaturePoints: metricsResult?.data?.temperatureCelsius?.metrics?.length || 0,
							entrancePoints: metricsResult?.data?.entranceMovement?.metrics?.length || 0,
						},
						selectedFrameImage: selectedFrameImage
							? {
								frameSideId: selectedFrameImage.frameSideId,
								optimizedUrl: selectedFrameImage.optimizedUrl,
								optimizedMaxDimensionPx: selectedFrameImage.optimizedMaxDimensionPx,
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
					text: advisorThinkingMessage,
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
					addMessage({ id: buildId('reply'), role: 'assistant', html: adviceHtml })
				} else {
					removeMessage(pendingReplyId)
					addMessage({
						id: buildId('reply'),
						role: 'error',
						text: responseErrorMessage || summaryUnavailableMessage,
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
				apiaryOverviewContext,
				shouldRender,
			viewContext,
			generateAdvice,
				currentViewLabel,
				keyboardShortcutsLabel,
				openHiveDetailMessage,
				advisorThinkingMessage,
				summaryUnavailableMessage,
				failedAdvisoryMessage,
				location.pathname,
			viewContext.name,
			frameRouteContext,
			fetchAiUsage,
		])

	const onSendUserMessage = async () => {
		const chatMessage = draftMessage.trim()
		if (!chatMessage || billingLocked || !adviceContext || isSendingUserMessage) {
			return
		}

		const userMessageId = buildId('user')
		const pendingReplyId = buildId('reply-loading')
		const nextMessages = [
			...messages,
			{ id: userMessageId, role: 'user' as const, text: chatMessage },
			{ id: pendingReplyId, role: 'assistant' as const, text: advisorThinkingMessage, loading: true },
		]
		setMessages(nextMessages)
		setDraftMessage('')
		setIsSendingUserMessage(true)

		try {
			const chatHistory = nextMessages
				.filter((message) => message.role === 'user' || message.role === 'assistant')
				.slice(-12)
				.map((message) => ({
					role: message.role,
					text: message.text || message.html || '',
				}))

			const response = await generateAdvice({
				hiveID: advisorTargetHiveID,
				langCode: advisorLangCode,
				adviceContext: {
					...adviceContext,
					chatMessage,
					chatHistory,
				},
			})

			const adviceHtml = response?.data?.generateHiveAdvice
			const responseErrorMessage = response?.error?.message
			if (adviceHtml) {
				removeMessage(pendingReplyId)
				addMessage({ id: buildId('reply'), role: 'assistant', html: adviceHtml })
			} else {
				removeMessage(pendingReplyId)
				addMessage({
					id: buildId('reply'),
					role: 'error',
					text: responseErrorMessage || summaryUnavailableMessage,
				})
			}
			await fetchAiUsage()
		} catch (error) {
			removeMessage(pendingReplyId)
			addMessage({
				id: buildId('error'),
				role: 'error',
				text: failedAdvisoryMessage,
			})
		} finally {
			setIsSendingUserMessage(false)
		}
	}

	const aiUsagePercent = Math.max(0, Math.min(100, Number(aiUsage?.percentUsed || 0)))
	const aiUsageRemaining = Math.max(0, 100 - aiUsagePercent)
	const batteryColor = aiUsageRemaining > 60 ? '#2f8b0b' : aiUsageRemaining > 30 ? '#d49d0f' : '#b22222'
	const aiUsageSubtitle = usageLoading
		? `${aiUsageRemainingLabel}: ...`
		: aiUsage
			? `${aiUsageRemainingLabel}: ${aiUsageRemaining}%`
			: `${aiUsageRemainingLabel}: ${aiUsageUnavailableLabel}`

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
					{!billingLocked && (
						<div className={styles.usageRow}>
							<p className={styles.usage}>{aiUsageSubtitle}</p>
							{aiUsage && (
								<span className={styles.battery} aria-label={`${aiUsageRemainingLabel}: ${aiUsageRemaining}%`}>
									{Array.from({ length: 8 }).map((_, index) => {
										const threshold = ((index + 1) / 8) * 100
										const isOn = aiUsageRemaining >= threshold
										return (
											<span
												key={`battery-segment-${index}`}
												className={`${styles.batterySegment} ${isOn ? styles.on : ''}`}
												style={isOn ? { backgroundColor: batteryColor } : undefined}
											/>
										)
									})}
									<span className={styles.batteryCap} />
								</span>
							)}
						</div>
					)}
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
							: message.role === 'user'
								? styles.user
							: message.role === 'error'
								? styles.error
								: styles.system
					return (
						<div key={message.id} className={`${styles.message} ${roleClass}`}>
							{message.shortcuts ? (
								<div>
									<strong>{message.shortcutsTitle || keyboardShortcutsLabel}:</strong>
									<ul className={styles.shortcutList}>
										{message.shortcuts.map((item, index) => (
												<li key={`${message.id}-${index}`} className={styles.shortcutItem}>
													<KeyboardHints
														keys={formatShortcutHintKeys(item.keys)}
														absolute={false}
													alwaysVisible
													className={styles.inlineHint}
												/>
												<span>{item.action}</span>
											</li>
										))}
									</ul>
								</div>
							) : message.payloadOverview ? (
								<details className={styles.payloadDetails}>
									<summary className={styles.payloadSummary}>AI payload overview</summary>
									<pre className={styles.payloadPre}>
										{JSON.stringify(message.payloadOverview, null, 2)}
									</pre>
								</details>
							) : message.html ? (
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
			<div className={styles.composer}>
				<textarea
					className={styles.composerInput}
					value={draftMessage}
					onChange={(event) =>
						setDraftMessage((event.target as HTMLTextAreaElement).value)
					}
					placeholder={askAdvisorPlaceholder}
					rows={3}
					disabled={billingLocked || !adviceContext || isSendingUserMessage}
					onKeyDown={(event) => {
						if (event.key === 'Enter' && !event.shiftKey) {
							event.preventDefault()
							onSendUserMessage()
						}
					}}
				/>
				<button
					className={styles.sendBtn}
					type="button"
					onClick={onSendUserMessage}
					disabled={
						billingLocked ||
						!adviceContext ||
						isSendingUserMessage ||
						!draftMessage.trim()
					}
				>
					{sendButtonLabel}
				</button>
			</div>
		</div>
	)
}
