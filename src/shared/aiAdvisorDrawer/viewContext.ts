import type { DrawerTranslations, ViewContext } from './types'

export function getViewContext(
	pathname: string,
	labels: DrawerTranslations
): ViewContext {
	const isHiveDetailView = /^\/apiaries\/\d+\/hives\/\d+(?:\/|$)/.test(pathname)
	const isApiaryOverviewView = /^\/apiaries\/\d+\/?$/.test(pathname)
	const isFrameView =
		/^\/apiaries\/\d+\/hives\/\d+\/box\/\d+\/frame\/\d+(?:\/\d+)?\/?$/.test(
			pathname
		)
	const isCanvasEditView =
		/^\/apiaries\/\d+\/hives\/\d+\/box\/\d+\/frame\/\d+\/\d+\/canvas-edit(?:\/|$)/.test(
			pathname
		)
	const isHiveListView =
		pathname === '/' || pathname === '/apiaries' || pathname === '/apiaries/'
	const isWarehouseQueenListView =
		pathname === '/warehouse/queens' || pathname === '/warehouse/queens/'
	const isDeviceListView = pathname === '/devices' || pathname === '/devices/'

	if (isCanvasEditView) {
		return {
			name: labels.canvasEditViewName,
			description: labels.canvasEditViewDescription,
			shortcuts: [
				{ keys: 'Shift + ?', action: labels.shortcutsActionOpenAdvisor },
				{ keys: 'Ctrl + M', action: labels.shortcutsActionToggleLeftMenu },
				{
					keys: '1-9 / 0',
					action: labels.shortcutsActionGoToLeftMenuItemByNumber,
				},
				{ keys: 'Esc', action: labels.shortcutsActionCloseDrawer },
				{ keys: 'A', action: labels.shortcutsActionGoToApiaryView },
				{ keys: 'H', action: labels.shortcutsActionGoToHiveListView },
				{
					keys: 'Arrow Left / Arrow Right',
					action: labels.shortcutsActionSwitchSelectedHiveFrames,
				},
				{
					keys: 'Arrow Up / Arrow Down',
					action: labels.shortcutsActionSwitchSelectedHiveSections,
				},
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
				{ keys: 'Ctrl + M', action: labels.shortcutsActionToggleLeftMenu },
				{
					keys: '1-9 / 0',
					action: labels.shortcutsActionGoToLeftMenuItemByNumber,
				},
				{ keys: 'Esc', action: labels.shortcutsActionCloseDrawer },
				{ keys: 'A', action: labels.shortcutsActionGoToApiaryView },
				{ keys: 'H', action: labels.shortcutsActionGoToHiveListView },
				{
					keys: 'Arrow Left / Arrow Right',
					action: labels.shortcutsActionSwitchSelectedHiveFrames,
				},
				{
					keys: 'Arrow Up / Arrow Down',
					action: labels.shortcutsActionSwitchSelectedHiveSections,
				},
				{
					keys: 'Tab / Shift + Tab',
					action: labels.shortcutsActionMoveFocusAcrossControls,
				},
			],
		}
	}

	if (isHiveDetailView) {
		return {
			name: labels.hiveDetailViewName,
			description: labels.hiveDetailViewDescription,
			shortcuts: [
				{ keys: 'Shift + ?', action: labels.shortcutsActionOpenAdvisor },
				{ keys: 'Ctrl + M', action: labels.shortcutsActionToggleLeftMenu },
				{
					keys: '1-9 / 0',
					action: labels.shortcutsActionGoToLeftMenuItemByNumber,
				},
				{ keys: 'Esc', action: labels.shortcutsActionCloseDrawer },
				{ keys: 'A', action: labels.shortcutsActionGoToApiaryView },
				{ keys: 'H', action: labels.shortcutsActionGoToHiveListView },
				{ keys: 'E', action: labels.shortcutsActionEditHiveMainInfo },
				{
					keys: 'Arrow Left / Arrow Right',
					action: labels.shortcutsActionSwitchSelectedHiveFrames,
				},
				{
					keys: 'Arrow Up / Arrow Down',
					action: labels.shortcutsActionSwitchSelectedHiveSections,
				},
				{
					keys: 'Backspace',
					action: labels.shortcutsActionDeleteSelectedHiveSection,
				},
				{ keys: 'Del', action: labels.shortcutsActionDeleteSelectedHiveFrame },
				{
					keys: 'Tab / Shift + Tab',
					action: labels.shortcutsActionMoveFocusAcrossControls,
				},
				{
					keys: 'Enter',
					action: labels.shortcutsActionConfirmFocusedDialogAction,
				},
			],
		}
	}

	if (isApiaryOverviewView) {
		return {
			name: labels.apiaryOverviewViewName,
			description: labels.apiaryOverviewViewDescription,
			shortcuts: [
				{ keys: 'Shift + ?', action: labels.shortcutsActionOpenAdvisor },
				{ keys: 'Ctrl + M', action: labels.shortcutsActionToggleLeftMenu },
				{
					keys: '1-9 / 0',
					action: labels.shortcutsActionGoToLeftMenuItemByNumber,
				},
				{ keys: 'Esc', action: labels.shortcutsActionCloseDrawer },
				{ keys: 'H', action: labels.shortcutsActionGoToHiveListView },
				{
					keys: 'Tab / Shift + Tab',
					action: labels.shortcutsActionMoveFocusAcrossPageControls,
				},
			],
		}
	}

	if (isHiveListView) {
		return {
			name: labels.hiveListViewName,
			description: labels.hiveListViewDescription,
			shortcuts: [
				{ keys: 'Shift + ?', action: labels.shortcutsActionOpenAdvisor },
				{ keys: 'Ctrl + M', action: labels.shortcutsActionToggleLeftMenu },
				{
					keys: '1-9 / 0',
					action: labels.shortcutsActionGoToLeftMenuItemByNumber,
				},
				{ keys: 'Esc', action: labels.shortcutsActionCloseDrawer },
				{
					keys: 'Tab / Shift + Tab',
					action: labels.shortcutsActionMoveFocusAcrossPageControls,
				},
				{
					keys: 'Arrow keys',
					action: labels.shortcutsActionMoveHiveFocusInListTable,
				},
			],
		}
	}

	if (isWarehouseQueenListView) {
		return {
			name: labels.warehouseQueenListViewName,
			description: labels.warehouseQueenListViewDescription,
			shortcuts: [
				{ keys: 'Shift + ?', action: labels.shortcutsActionOpenAdvisor },
				{ keys: 'Ctrl + M', action: labels.shortcutsActionToggleLeftMenu },
				{
					keys: '1-9 / 0',
					action: labels.shortcutsActionGoToLeftMenuItemByNumber,
				},
				{ keys: 'Esc', action: labels.shortcutsActionCloseDrawer },
				{
					keys: 'Arrow Up / Arrow Down',
					action: labels.shortcutsActionMoveQueenFocusInTable,
				},
				{
					keys: 'Del',
					action: labels.shortcutsActionDeleteSelectedWarehouseQueen,
				},
				{
					keys: 'Esc',
					action: labels.shortcutsActionCancelFocusedDialogAction,
				},
				{
					keys: 'Enter',
					action: labels.shortcutsActionConfirmFocusedDialogAction,
				},
			],
		}
	}

	if (isDeviceListView) {
		return {
			name: labels.deviceListViewName,
			description: labels.deviceListViewDescription,
			shortcuts: [
				{ keys: 'Shift + ?', action: labels.shortcutsActionOpenAdvisor },
				{ keys: 'Ctrl + M', action: labels.shortcutsActionToggleLeftMenu },
				{
					keys: '1-9 / 0',
					action: labels.shortcutsActionGoToLeftMenuItemByNumber,
				},
				{ keys: 'Esc', action: labels.shortcutsActionCloseDrawer },
				{
					keys: 'Arrow Up / Arrow Down',
					action: labels.shortcutsActionMoveDeviceFocusInList,
				},
				{ keys: 'Del', action: labels.shortcutsActionDeleteSelectedDevice },
				{
					keys: 'Esc',
					action: labels.shortcutsActionCancelFocusedDialogAction,
				},
				{
					keys: 'Enter',
					action: labels.shortcutsActionConfirmFocusedDialogAction,
				},
			],
		}
	}

	return {
		name: labels.currentViewName,
		description: labels.currentViewDescription,
		shortcuts: [
			{ keys: 'Shift + ?', action: labels.shortcutsActionOpenAdvisor },
			{ keys: 'Ctrl + M', action: labels.shortcutsActionToggleLeftMenu },
			{
				keys: '1-9 / 0',
				action: labels.shortcutsActionGoToLeftMenuItemByNumber,
			},
			{ keys: 'Esc', action: labels.shortcutsActionCloseDrawer },
			{
				keys: 'Tab / Shift + Tab',
				action: labels.shortcutsActionMoveFocusAcrossPageControls,
			},
		],
	}
}
