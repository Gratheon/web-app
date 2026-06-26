export type ChatMessage = {
	id: string
	role: 'assistant' | 'system' | 'error' | 'user'
	text?: string
	html?: string
	payloadOverview?: Record<string, any>
	shortcuts?: ViewContext['shortcuts']
	shortcutsTitle?: string
	loading?: boolean
}

export type ViewContext = {
	name: string
	description: string
	shortcuts: Array<{
		keys: string
		action: string
	}>
}

export type DrawerTranslations = {
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

export type FrameRouteContext = {
	boxId: number
	frameId: number
	frameSideId: number | null
	isCanvasEdit: boolean
}

export type ApiaryRouteContext = {
	apiaryId: number
}
