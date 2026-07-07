import React from 'react'

import HivesPlaceholder from '../../../shared/hivesPlaceholder'

import styles from './index.module.less'
import { sortHives } from '../hiveSort'
import { apiaryTypes, normalizeApiaryType } from '@/models/apiary'
import ApiaryListRowSkeleton from './skeleton'
import ApiaryListRowHeader from './header'
import HiveListView from './listView'
import HiveTableView from './tableView'
import { useApiaryRowKeyboard } from './useApiaryRowKeyboard'

export default function ApiaryListRow({
	apiary,
	boxSystems,
	user,
	sortBy,
	sortOrder,
	onSortChange,
	visibleColumns,
	onToggleColumn,
	selectedHiveApiaryId,
	selectedHiveId,
	onSelectHive,
	onNavigateAcrossApiaries,
	hasMixedApiaryTypes,
	isLoading = false,
	forcedListType = null,
}) {
	const [listType, setListType] = React.useState(() => {
		if (forcedListType) {
			return forcedListType
		}

		if (typeof window === 'undefined') {
			return 'list'
		}

		return localStorage.getItem('apiaryListType.' + apiary.id) || 'list'
	})
	const [columnsPopupOpen, setColumnsPopupOpen] = React.useState(false)
	const columnsPopupRef = React.useRef(null)
	const rowRef = React.useRef(null)
	const listItemRefs = React.useRef({})
	const apiaryType = normalizeApiaryType(apiary?.type)
	const isMobileApiary = apiaryType === apiaryTypes.MOBILE
	const dateTimeLang =
		user?.lang || (typeof navigator !== 'undefined' ? navigator.language : 'en')

	React.useEffect(() => {
		if (!forcedListType) {
			return
		}

		setListType(forcedListType)
	}, [forcedListType])

	React.useEffect(() => {
		if (isLoading) {
			return () => {}
		}

		const handleClickOutside = (event) => {
			if (
				columnsPopupRef.current &&
				!columnsPopupRef.current.contains(event.target)
			) {
				setColumnsPopupOpen(false)
			}
		}

		if (typeof window === 'undefined') {
			return () => {}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isLoading])

	const sortedHives = React.useMemo(() => {
		if (!apiary?.hives) {
			return []
		}

		return sortHives(apiary.hives, sortBy, sortOrder)
	}, [apiary?.hives, sortBy, sortOrder])
	const apiaryHives = Array.isArray(apiary?.hives) ? apiary.hives : []
	const [isMobileLayout, setIsMobileLayout] = React.useState(() => {
		if (
			typeof window === 'undefined' ||
			typeof window.matchMedia !== 'function'
		) {
			return false
		}

		return window.matchMedia('(max-width: 576px)').matches
	})
	const effectiveListType = isMobileLayout ? 'list' : listType

	React.useEffect(() => {
		if (
			typeof window === 'undefined' ||
			typeof window.matchMedia !== 'function'
		) {
			return () => {}
		}

		// WHY: mobile layout should stay simple and ignore a saved table preference,
		// while wider layouts keep the user's existing list/table choice.
		const mediaQuery = window.matchMedia('(max-width: 576px)')
		const handleChange = () => setIsMobileLayout(mediaQuery.matches)

		handleChange()
		mediaQuery.addEventListener('change', handleChange)

		return () => {
			mediaQuery.removeEventListener('change', handleChange)
		}
	}, [])

	const registerHiveItem = React.useCallback((hiveId, element) => {
		if (element) {
			listItemRefs.current[hiveId] = element
		} else {
			delete listItemRefs.current[hiveId]
		}
	}, [])

	const handleListTypeChange = React.useCallback(
		(nextListType) => {
			setListType(nextListType)
			localStorage.setItem('apiaryListType.' + apiary.id, nextListType)
		},
		[apiary.id]
	)

	useApiaryRowKeyboard({
		apiaryId: apiary.id,
		columnsPopupOpen,
		columnsPopupRef,
		effectiveListType,
		isLoading,
		listItemRefs,
		onNavigateAcrossApiaries,
		onSelectHive,
		rowRef,
		selectedHiveApiaryId,
		selectedHiveId,
		sortedHives,
	})

	if (isLoading) {
		return (
			<ApiaryListRowSkeleton
				listType={effectiveListType}
				visibleColumns={visibleColumns}
				showTypeIcon={hasMixedApiaryTypes}
				hiveCount={Math.max(
					apiary?.hives?.length || 0,
					effectiveListType === 'table' ? 4 : 5
				)}
				rowCount={Math.max(apiary?.hives?.length || 0, 4)}
			/>
		)
	}

	return (
		<div
			className={styles.apiary}
			ref={rowRef}
			tabIndex={0}
			data-apiary-keyboard-row="1"
			data-apiary-row-id={apiary.id}
		>
			<ApiaryListRowHeader
				apiary={apiary}
				apiaryHives={apiaryHives}
				effectiveListType={effectiveListType}
				isMobileApiary={isMobileApiary}
				isMobileLayout={isMobileLayout}
				onListTypeChange={handleListTypeChange}
			/>

			<div className={styles.hives}>
				{apiaryHives.length == 0 && <HivesPlaceholder />}
				{effectiveListType == 'list' && (
					<HiveListView
						apiaryId={apiary.id}
						onSelectHive={onSelectHive}
						registerHiveItem={registerHiveItem}
						selectedHiveApiaryId={selectedHiveApiaryId}
						selectedHiveId={selectedHiveId}
						sortedHives={sortedHives}
					/>
				)}

				{effectiveListType == 'table' && apiaryHives.length > 0 && (
					<HiveTableView
						apiaryId={apiary.id}
						boxSystems={boxSystems}
						columnsPopupOpen={columnsPopupOpen}
						columnsPopupRef={columnsPopupRef}
						dateTimeLang={dateTimeLang}
						onSelectHive={onSelectHive}
						onSortChange={onSortChange}
						onToggleColumn={onToggleColumn}
						registerHiveItem={registerHiveItem}
						selectedHiveApiaryId={selectedHiveApiaryId}
						selectedHiveId={selectedHiveId}
						setColumnsPopupOpen={setColumnsPopupOpen}
						sortBy={sortBy}
						sortedHives={sortedHives}
						sortOrder={sortOrder}
						visibleColumns={visibleColumns}
					/>
				)}
			</div>
		</div>
	)
}
