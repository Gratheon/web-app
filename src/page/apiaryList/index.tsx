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
import PagePaddedCentered from '@/shared/pagePaddedCentered/index'

const TABLE_VISIBLE_COLUMNS_KEY = 'apiaryList.tableVisibleColumns'
const TABLE_SORT_KEY = 'apiaryList.tableSort'
const DEFAULT_VISIBLE_COLUMNS = [
	'HIVE_NUMBER',
	'QUEEN',
	'BEE_COUNT',
	'STATUS',
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

			const firstRow = document.querySelector('[data-apiary-keyboard-row="1"]') as HTMLElement | null
			if (!firstRow) {
				return
			}

			event.preventDefault()
			firstRow.focus()

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

	const { loading, error, data, errorNetwork } = useQuery(gql`
		query apiaries {
			apiaries {
				id
				name

				hives {
					id
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

	if (loading) {
		return <Loader />
	}

	const { apiaries } = data

	return (
		<PagePaddedCentered>
			<ErrorMsg error={error || errorNetwork} borderRadius={0} />
			{apiaries !== null && apiaries?.length === 0 && <ApiariesPlaceholder />}

			{apiaries &&
				apiaries.map((apiary, i) => (
					<ApiaryListRow
						key={i}
						apiary={apiary}
						user={user}
						sortBy={hiveSortBy}
						sortOrder={hiveSortOrder}
						onSortChange={handleHiveSortChange}
						visibleColumns={visibleColumns}
						onToggleColumn={toggleVisibleColumn}
					/>
				))}

			<div style="text-align:center; margin: 15px 0;">
				<Button 
					color={apiaries && apiaries.length === 0 ? 'green' : 'white'}
					href="/apiaries/create"><T ctx="its a button">Setup new apiary</T></Button>
			</div>
		</PagePaddedCentered>
	)
}
