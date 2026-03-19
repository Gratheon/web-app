import React from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useQuery } from '../../api'

import Button from '../../shared/button'
import { getUser } from '@/models/user'
import Loader from '../../shared/loader'
import ErrorMsg from '../../shared/messageError'
import T from '../../shared/translate'

import ApiaryListRow from './apiaryListRow'
import ApiariesPlaceholder from './apiariesPlaceholder'
import { sortHives } from './hiveSort'
import { normalizeApiaryType } from '@/models/apiary'
import styles from './style.module.less'

const TABLE_VISIBLE_COLUMNS_KEY = 'apiaryList.tableVisibleColumns'
const TABLE_SORT_KEY = 'apiaryList.tableSort'
const DEFAULT_VISIBLE_COLUMNS = [
	'HIVE_NUMBER',
	'QUEEN',
	'BEE_COUNT',
	'STATUS',
	'BOX_SYSTEM',
	'LAST_TREATMENT',
	'LAST_INSPECTION',
]
const DEFAULT_SORT_BY = 'HIVE_NUMBER'
const DEFAULT_SORT_ORDER = 'ASC'
const ALLOWED_SORT_COLUMNS = [
	'HIVE_NUMBER',
	'QUEEN',
	'BEE_COUNT',
	'STATUS',
	'LAST_TREATMENT',
	'LAST_INSPECTION',
	'QUEEN_YEAR',
	'QUEEN_RACE',
]
const ALLOWED_SORT_ORDERS = ['ASC', 'DESC']

export default function ApiaryList(props) {
	let user = useLiveQuery(() => getUser(), [], null)
	const [selectedHive, setSelectedHive] = React.useState({
		apiaryId: null,
		hiveId: null,
	})

	const focusHiveElement = React.useCallback((apiaryId, hiveId) => {
		if (typeof document === 'undefined' || !apiaryId || !hiveId) {
			return false
		}

		const hiveSelector = `[data-hive-item="1"][data-apiary-id="${String(apiaryId)}"][data-hive-id="${String(hiveId)}"]`
		const hiveElement = document.querySelector(hiveSelector) as HTMLElement | null
		if (!hiveElement) {
			return false
		}

		const focusTarget = (hiveElement.querySelector('a') || hiveElement) as HTMLElement
		focusTarget.focus()
		hiveElement.scrollIntoView({ block: 'nearest', inline: 'nearest' })
		return true
	}, [])

	const [hiveSortBy, setHiveSortBy] = React.useState(() => {
		if (typeof window === 'undefined') {
			return DEFAULT_SORT_BY
		}

		try {
			const raw = localStorage.getItem(TABLE_SORT_KEY)
			if (!raw) {
				return DEFAULT_SORT_BY
			}

			const parsed = JSON.parse(raw)
			if (parsed?.sortBy && ALLOWED_SORT_COLUMNS.includes(parsed.sortBy)) {
				return parsed.sortBy
			}
		} catch (error) {
			console.error('Failed to parse table sort config', error)
		}

		return DEFAULT_SORT_BY
	})
	const [hiveSortOrder, setHiveSortOrder] = React.useState(() => {
		if (typeof window === 'undefined') {
			return DEFAULT_SORT_ORDER
		}

		try {
			const raw = localStorage.getItem(TABLE_SORT_KEY)
			if (!raw) {
				return DEFAULT_SORT_ORDER
			}

			const parsed = JSON.parse(raw)
			if (parsed?.sortOrder && ALLOWED_SORT_ORDERS.includes(parsed.sortOrder)) {
				return parsed.sortOrder
			}
		} catch (error) {
			console.error('Failed to parse table sort config', error)
		}

		return DEFAULT_SORT_ORDER
	})

	const { loading, error, data, errorNetwork } = useQuery(gql`
		query apiaries {
			boxSystems {
				id
				name
				isDefault
			}
			apiaries {
				id
				name
				type

					hives {
						id
						hiveType
						boxSystemId
						hiveNumber
						beeCount
					status

					lastInspection
					isNew

					family{
						id
						name
						age
						race
						added
						lastTreatment
					}
					families{
						id
						name
						age
						race
						added
						lastTreatment
					}

					boxes {
						id
						position
						color
						type
					}
				}
			}
		}
	`)

	const apiaries = data?.apiaries || []
	const hasMixedApiaryTypes = React.useMemo(() => {
		const distinctTypes = new Set((apiaries || []).map((apiary) => normalizeApiaryType(apiary?.type)))
		return distinctTypes.size > 1
	}, [apiaries])

	const sortedHivesByApiary = React.useMemo(() => (
		apiaries.map((apiary) => ({
			apiaryId: apiary.id,
			hives: sortHives(apiary.hives || [], hiveSortBy, hiveSortOrder),
		}))
	), [apiaries, hiveSortBy, hiveSortOrder])

	const selectHive = React.useCallback((apiaryId, hiveId, options = { focus: false }) => {
		setSelectedHive((prev) => {
			if (prev.apiaryId === apiaryId && prev.hiveId === hiveId) {
				return prev
			}
			return { apiaryId, hiveId }
		})

		if (options.focus) {
			requestAnimationFrame(() => {
				focusHiveElement(apiaryId, hiveId)
			})
		}
	}, [focusHiveElement])

	const handleNavigateAcrossApiaries = React.useCallback(({ apiaryId, direction }) => {
		const currentApiaryIndex = sortedHivesByApiary.findIndex((apiary) => apiary.apiaryId === apiaryId)
		if (currentApiaryIndex === -1) {
			return
		}

		const step = direction === 'prev' ? -1 : 1
		for (let i = currentApiaryIndex + step; i >= 0 && i < sortedHivesByApiary.length; i += step) {
			const adjacentApiary = sortedHivesByApiary[i]
			if (!adjacentApiary.hives.length) {
				continue
			}

			const targetHive =
				direction === 'prev'
					? adjacentApiary.hives[adjacentApiary.hives.length - 1]
					: adjacentApiary.hives[0]

			selectHive(adjacentApiary.apiaryId, targetHive.id, { focus: true })
			return
		}
	}, [selectHive, sortedHivesByApiary])

	React.useEffect(() => {
		if (!sortedHivesByApiary.length) {
			setSelectedHive({ apiaryId: null, hiveId: null })
			return
		}

		if (
			selectedHive.apiaryId &&
			selectedHive.hiveId &&
			sortedHivesByApiary.some((apiary) => (
				apiary.apiaryId === selectedHive.apiaryId &&
				apiary.hives.some((hive) => hive.id === selectedHive.hiveId)
			))
		) {
			return
		}

		const firstApiaryWithHive = sortedHivesByApiary.find((apiary) => apiary.hives.length > 0)
		if (!firstApiaryWithHive) {
			setSelectedHive({ apiaryId: null, hiveId: null })
			return
		}

		setSelectedHive({
			apiaryId: firstApiaryWithHive.apiaryId,
			hiveId: firstApiaryWithHive.hives[0].id,
		})
	}, [selectedHive.apiaryId, selectedHive.hiveId, sortedHivesByApiary])

	React.useEffect(() => {
		const isTypingTarget = (target) => {
			if (!target) return false
			const tagName = String(target.tagName || '').toLowerCase()
			return (
				target.isContentEditable ||
				tagName === 'input' ||
				tagName === 'textarea' ||
				tagName === 'select'
			)
		}

		const onKeyDown = (event) => {
			if (isTypingTarget(event.target)) {
				return
			}

			const isArrowKey =
				event.key === 'ArrowUp' ||
				event.key === 'ArrowDown' ||
				event.key === 'ArrowLeft' ||
				event.key === 'ArrowRight'

			if (!isArrowKey) {
				return
			}

			const activeElement = document.activeElement
			const activeRow = activeElement?.closest?.('[data-apiary-keyboard-row="1"]')
			if (activeRow) {
				return
			}

			let hasFocused = false
			if (selectedHive.apiaryId && selectedHive.hiveId) {
				hasFocused = focusHiveElement(selectedHive.apiaryId, selectedHive.hiveId)
			}

			if (!hasFocused) {
				const firstApiaryWithHive = sortedHivesByApiary.find((apiary) => apiary.hives.length > 0)
				if (!firstApiaryWithHive) {
					return
				}

				const firstHive = firstApiaryWithHive.hives[0]
				selectHive(firstApiaryWithHive.apiaryId, firstHive.id)
				hasFocused = focusHiveElement(firstApiaryWithHive.apiaryId, firstHive.id)
			}

			if (!hasFocused) {
				return
			}

			event.preventDefault()

			const replayEvent = new KeyboardEvent('keydown', {
				key: event.key,
				code: event.code,
				location: event.location,
				repeat: event.repeat,
				bubbles: true,
				cancelable: true,
			})
			document.dispatchEvent(replayEvent)
		}

		document.addEventListener('keydown', onKeyDown, true)
		return () => document.removeEventListener('keydown', onKeyDown, true)
	}, [focusHiveElement, selectHive, selectedHive.apiaryId, selectedHive.hiveId, sortedHivesByApiary])
	const [visibleColumns, setVisibleColumns] = React.useState(() => {
		if (typeof window === 'undefined') {
			return DEFAULT_VISIBLE_COLUMNS
		}

		try {
			const raw = localStorage.getItem(TABLE_VISIBLE_COLUMNS_KEY)
			if (!raw) {
				return DEFAULT_VISIBLE_COLUMNS
			}

			const parsed = JSON.parse(raw)
			if (!Array.isArray(parsed) || parsed.length === 0) {
				return DEFAULT_VISIBLE_COLUMNS
			}

			if (!parsed.includes('BOX_SYSTEM')) {
				return [...parsed, 'BOX_SYSTEM']
			}

			return parsed
		} catch (error) {
			console.error('Failed to parse table visible columns config', error)
			return DEFAULT_VISIBLE_COLUMNS
		}
	})

	const handleHiveSortChange = React.useCallback((sortBy) => {
		if (hiveSortBy === sortBy) {
			setHiveSortOrder(prev => (prev === 'ASC' ? 'DESC' : 'ASC'))
			return
		}

		setHiveSortBy(sortBy)
		setHiveSortOrder('ASC')
	}, [hiveSortBy])

	const toggleVisibleColumn = React.useCallback((columnKey) => {
		setVisibleColumns((prev) => {
			const isVisible = prev.includes(columnKey)
			if (isVisible && prev.length === 1) {
				return prev
			}

			if (isVisible) {
				return prev.filter(column => column !== columnKey)
			}

			return [...prev, columnKey]
		})
	}, [])

	React.useEffect(() => {
		if (typeof window === 'undefined') {
			return
		}

		localStorage.setItem(TABLE_VISIBLE_COLUMNS_KEY, JSON.stringify(visibleColumns))
	}, [visibleColumns])

	React.useEffect(() => {
		if (typeof window === 'undefined') {
			return
		}

		localStorage.setItem(TABLE_SORT_KEY, JSON.stringify({
			sortBy: hiveSortBy,
			sortOrder: hiveSortOrder,
		}))
	}, [hiveSortBy, hiveSortOrder])

	if (loading) {
		return <Loader />
	}

	return (
		<div className={styles.page}>
			<ErrorMsg error={error || errorNetwork} borderRadius={0} />
			{apiaries !== null && apiaries?.length === 0 && <ApiariesPlaceholder />}

			{apiaries &&
				apiaries.map((apiary, i) => (
						<ApiaryListRow
							key={i}
							apiary={apiary}
							boxSystems={data?.boxSystems || []}
							user={user}
						sortBy={hiveSortBy}
						sortOrder={hiveSortOrder}
						onSortChange={handleHiveSortChange}
						visibleColumns={visibleColumns}
						onToggleColumn={toggleVisibleColumn}
						selectedHiveApiaryId={selectedHive.apiaryId}
						selectedHiveId={selectedHive.hiveId}
						onSelectHive={selectHive}
					onNavigateAcrossApiaries={handleNavigateAcrossApiaries}
					hasMixedApiaryTypes={hasMixedApiaryTypes}
				/>
			))}

			<div style="text-align:center; margin: 15px 0;">
				<Button 
					color={apiaries && apiaries.length === 0 ? 'green' : 'white'}
					href="/apiaries/create"><T ctx="its a button">Setup new apiary</T></Button>
			</div>
		</div>
	)
}
