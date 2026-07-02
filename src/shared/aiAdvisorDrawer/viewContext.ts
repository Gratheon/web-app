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
				{
					keys: 'Ctrl + A / Cmd + A',
					action: labels.shortcutsActionGoToApiaryView,
				},
				{
					keys: 'Ctrl + H / Cmd + H',
					action: labels.shortcutsActionGoToHiveListView,
				},
				{
					keys: 'Arrow Left / Arrow Right',
					action: labels.shortcutsActionSwitchSelectedHiveFrames,
				},
				{
					keys: 'Arrow Up / Arrow Down',
					action: labels.shortcutsActionSwitchSelectedHiveSections,
				},
				{ keys: 'Shift + C', action: labels.shortcutsActionSwitchToCellBrush },
				{ keys: 'Shift + F', action: labels.shortcutsActionSwitchToFreeDraw },
				{ keys: 'Shift + X', action: labels.shortcutsActionSwitchToCellEraser },
				{ keys: 'Shift + N', action: labels.shortcutsActionSetCellTypeNectar },
				{ keys: 'Shift + Y', action: labels.shortcutsActionSetCellTypeHoney },
				{ keys: 'Shift + P', action: labels.shortcutsActionSetCellTypePollen },
				{ keys: 'Shift + G', action: labels.shortcutsActionSetCellTypeEggs },
				{ keys: 'Shift + B', action: labels.shortcutsActionSetCellTypeBrood },
				{ keys: 'Shift + K', action: labels.shortcutsActionSetCellTypeCappedBrood },
				{ keys: 'Shift + D', action: labels.shortcutsActionSetCellTypeDroneBrood },
				{ keys: 'Shift + U', action: labels.shortcutsActionSetCellTypeEmpty },
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
				{
					keys: 'Ctrl + A / Cmd + A',
					action: labels.shortcutsActionGoToApiaryView,
				},
				{
					keys: 'Ctrl + H / Cmd + H',
					action: labels.shortcutsActionGoToHiveListView,
				},
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
				{
					keys: 'Ctrl + A / Cmd + A',
					action: labels.shortcutsActionGoToApiaryView,
				},
				{
					keys: 'Ctrl + H / Cmd + H',
					action: labels.shortcutsActionGoToHiveListView,
				},
				{
					keys: 'Ctrl + E / Cmd + E',
					action: labels.shortcutsActionEditHiveMainInfo,
				},
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
				{
					keys: 'Ctrl + H / Cmd + H',
					action: labels.shortcutsActionGoToHiveListView,
				},
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
