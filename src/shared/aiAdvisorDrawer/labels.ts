import { useMemo } from 'react'
import { useTranslation as t } from '@/shared/translate'

export function useDrawerLabels() {
	const currentViewLabel = t('Current view')
	const keyboardShortcutsLabel = t('Keyboard shortcuts')
	const hiveDetailViewName = t('Hive detail view')
	const hiveDetailViewDescription = t(
		'Detailed hive workflow with sections, frames, inspections, and metrics.'
	)
	const apiaryOverviewViewName = t('Apiary overview view')
	const apiaryOverviewViewDescription = t(
		'Apiary-level overview with colony list, placement, and local conditions context.'
	)
	const frameViewName = t('Frame view')
	const frameViewDescription = t(
		'Single frame-side view focused on detected cells, bees, queens, and varroa signals.'
	)
	const canvasEditViewName = t('Frame canvas edit view')
	const canvasEditViewDescription = t(
		'Frame-side canvas editor with tool switching, cell brush typing, and brush size controls.'
	)
	const hiveListViewName = t('Hive list view')
	const hiveListViewDescription = t(
		'Apiary overview with list and table hive navigation modes.'
	)
	const warehouseQueenListViewName = t('Warehouse queen list view')
	const warehouseQueenListViewDescription = t(
		'Warehouse queen table with keyboard row selection and deletion flow.'
	)
	const deviceListViewName = t('Device list view')
	const deviceListViewDescription = t(
		'Device list with keyboard row selection and deletion flow.'
	)
	const currentViewName = t('Current view')
	const currentViewDescription = t(
		'Page-level context and shortcuts are available here.'
	)
	const shortcutsActionOpenAdvisor = t('Open AI Advisor')
	const shortcutsActionToggleLeftMenu = t('Toggle left menu')
	const shortcutsActionGoToLeftMenuItemByNumber = t(
		'Go to left menu item by number'
	)
	const shortcutsActionCloseDrawer = t('Close AI Advisor drawer')
	const shortcutsActionGoToApiaryView = t('Go to apiary view')
	const shortcutsActionGoToHiveListView = t('Go to hive list view')
	const shortcutsActionEditHiveMainInfo = t('Edit hive main info')
	const shortcutsActionMoveFocusAcrossControls = t('Move focus across controls')
	const shortcutsActionConfirmFocusedDialogAction = t(
		'Confirm focused dialog action'
	)
	const shortcutsActionCancelFocusedDialogAction = t(
		'Cancel focused dialog action'
	)
	const shortcutsActionMoveFocusAcrossPageControls = t(
		'Move focus across page controls'
	)
	const shortcutsActionMoveHiveFocusInListTable = t(
		'Move hive focus in list/table view'
	)
	const shortcutsActionMoveQueenFocusInTable = t(
		'Move queen focus in table view'
	)
	const shortcutsActionMoveDeviceFocusInList = t(
		'Move device focus in list view'
	)
	const shortcutsActionSwitchSelectedHiveFrames = t(
		'Switch selected hive frames'
	)
	const shortcutsActionSwitchSelectedHiveSections = t(
		'Switch selected hive sections'
	)
	const shortcutsActionDeleteSelectedHiveFrame = t('Delete selected hive frame')
	const shortcutsActionDeleteSelectedHiveSection = t(
		'Delete selected hive section'
	)
	const shortcutsActionDeleteSelectedWarehouseQueen = t(
		'Delete selected warehouse queen'
	)
	const shortcutsActionDeleteSelectedDevice = t('Delete selected device')
	const shortcutsActionSwitchToCellBrush = t('Switch to cell brush')
	const shortcutsActionSwitchToFreeDraw = t('Switch to free draw')
	const shortcutsActionSwitchToCellEraser = t('Switch to cell eraser')
	const shortcutsActionSetCellTypeNectar = t('Set cell type to nectar')
	const shortcutsActionSetCellTypeHoney = t('Set cell type to honey')
	const shortcutsActionSetCellTypePollen = t('Set cell type to pollen')
	const shortcutsActionSetCellTypeEggs = t('Set cell type to eggs')
	const shortcutsActionSetCellTypeBrood = t('Set cell type to brood')
	const shortcutsActionSetCellTypeCappedBrood = t(
		'Set cell type to capped brood'
	)
	const shortcutsActionSetCellTypeDroneBrood = t('Set cell type to drone brood')
	const shortcutsActionSetCellTypeEmpty = t('Set cell type to empty')
	const shortcutsActionIncreaseBrushSize = t('Increase brush size')
	const shortcutsActionDecreaseBrushSize = t('Decrease brush size')
	const shortcutsActionUndoStroke = t('Undo stroke')
	const openHiveDetailMessage = t(
		'Open a hive detail page or apiary overview page to run AI analysis.'
	)
	const advisorThinkingMessage = t('AI Advisor is thinking...')
	const summaryUnavailableMessage = t(
		'AI Advisor did not return a summary yet. Backend endpoint may still be unavailable.'
	)
	const failedAdvisoryMessage = t(
		'Failed to complete AI advisory run. Please try again in a moment.'
	)
	const askAdvisorPlaceholder = t('Ask AI Advisor about this hive...')
	const sendButtonLabel = t('Send')
	const closeAiAdvisorLabel = t('Close AI Advisor')
	const aiAdvisorAvatarAlt = t('AI Advisor avatar')
	const aiUsageRemainingLabel = 'AI remaining'
	const aiUsageUnavailableLabel = 'unavailable'

	return useMemo(
		() => ({
			currentViewLabel,
			keyboardShortcutsLabel,
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
			openHiveDetailMessage,
			advisorThinkingMessage,
			summaryUnavailableMessage,
			failedAdvisoryMessage,
			askAdvisorPlaceholder,
			sendButtonLabel,
			closeAiAdvisorLabel,
			aiAdvisorAvatarAlt,
			aiUsageRemainingLabel,
			aiUsageUnavailableLabel,
		}),
		[
			currentViewLabel,
			keyboardShortcutsLabel,
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
			openHiveDetailMessage,
			advisorThinkingMessage,
			summaryUnavailableMessage,
			failedAdvisoryMessage,
			askAdvisorPlaceholder,
			sendButtonLabel,
			closeAiAdvisorLabel,
			aiAdvisorAvatarAlt,
			aiUsageRemainingLabel,
			aiUsageUnavailableLabel,
		]
	)
}
