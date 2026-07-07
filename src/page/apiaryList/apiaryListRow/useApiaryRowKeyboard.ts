import React from 'react'

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

export function useApiaryRowKeyboard({
	apiaryId,
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
}) {
	const getItemByHiveId = React.useCallback(
		(hiveId) => {
			return listItemRefs.current[hiveId] || null
		},
		[listItemRefs]
	)

	const focusHive = React.useCallback(
		(hive) => {
			if (!hive) return
			onSelectHive(apiaryId, hive.id)

			const item = getItemByHiveId(hive.id)
			if (!item) return

			const link = item.querySelector('a')
			if (link) {
				link.focus()
			}

			item.scrollIntoView({ block: 'nearest', inline: 'nearest' })
		},
		[apiaryId, getItemByHiveId, onSelectHive]
	)

	const findNextListHive = React.useCallback(
		(hives, currentIndex, direction) => {
			if (currentIndex < 0 || currentIndex >= hives.length) {
				return null
			}

			if (direction === 'left') {
				return hives[Math.max(0, currentIndex - 1)]
			}

			if (direction === 'right') {
				return hives[Math.min(hives.length - 1, currentIndex + 1)]
			}

			const positioned = hives
				.map((hive, index) => {
					const element = getItemByHiveId(hive.id)
					if (!element) return null
					const rect = element.getBoundingClientRect()
					return {
						hive,
						index,
						left: rect.left,
						top: rect.top,
						centerX: rect.left + rect.width / 2,
					}
				})
				.filter(Boolean)

			const current = positioned.find((entry) => entry.index === currentIndex)
			if (!current) return hives[currentIndex]

			const tolerance = 8
			const rows = []
			for (const entry of positioned) {
				const lastRow = rows[rows.length - 1]
				if (!lastRow || Math.abs(lastRow.top - entry.top) > tolerance) {
					rows.push({ top: entry.top, items: [entry] })
				} else {
					lastRow.items.push(entry)
				}
			}

			let rowIndex = -1
			for (let i = 0; i < rows.length; i += 1) {
				if (rows[i].items.some((item) => item.index === currentIndex)) {
					rowIndex = i
					break
				}
			}
			if (rowIndex === -1) return hives[currentIndex]

			const nextRowIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1
			if (nextRowIndex < 0 || nextRowIndex >= rows.length) {
				return hives[currentIndex]
			}

			const targetRowItems = rows[nextRowIndex].items
			let best = targetRowItems[0]
			for (const candidate of targetRowItems) {
				if (
					Math.abs(candidate.centerX - current.centerX) <
					Math.abs(best.centerX - current.centerX)
				) {
					best = candidate
				}
			}

			return best?.hive || hives[currentIndex]
		},
		[getItemByHiveId]
	)

	const moveToAdjacentApiary = React.useCallback(
		(direction) => {
			onNavigateAcrossApiaries?.({
				apiaryId,
				direction,
			})
		},
		[apiaryId, onNavigateAcrossApiaries]
	)

	const onRowKeyDown = React.useCallback(
		(event) => {
			if (columnsPopupOpen && columnsPopupRef.current?.contains(event.target)) {
				return
			}

			if (isTypingTarget(event.target)) {
				return
			}

			const key = event.key
			const canNavigateTable =
				effectiveListType === 'table' &&
				(key === 'ArrowUp' || key === 'ArrowDown')
			const canNavigateList =
				effectiveListType === 'list' &&
				(key === 'ArrowUp' ||
					key === 'ArrowDown' ||
					key === 'ArrowLeft' ||
					key === 'ArrowRight')

			if (!canNavigateTable && !canNavigateList) {
				return
			}

			if (!sortedHives?.length) {
				return
			}

			event.preventDefault()

			let currentIndex =
				selectedHiveApiaryId === apiaryId
					? sortedHives.findIndex((hive) => hive.id === selectedHiveId)
					: -1
			if (currentIndex === -1) {
				if (key === 'ArrowUp' || key === 'ArrowLeft') {
					focusHive(sortedHives[sortedHives.length - 1])
				} else {
					focusHive(sortedHives[0])
				}
				return
			}

			if (effectiveListType === 'table') {
				if (key === 'ArrowUp' && currentIndex === 0) {
					moveToAdjacentApiary('prev')
					return
				}
				if (key === 'ArrowDown' && currentIndex === sortedHives.length - 1) {
					moveToAdjacentApiary('next')
					return
				}

				const nextIndex =
					key === 'ArrowUp'
						? Math.max(0, currentIndex - 1)
						: Math.min(sortedHives.length - 1, currentIndex + 1)
				focusHive(sortedHives[nextIndex])
				return
			}

			if (effectiveListType === 'list') {
				const direction =
					key === 'ArrowUp'
						? 'up'
						: key === 'ArrowDown'
						? 'down'
						: key === 'ArrowLeft'
						? 'left'
						: 'right'

				const nextHive = findNextListHive(sortedHives, currentIndex, direction)
				if (nextHive) {
					if (nextHive.id === sortedHives[currentIndex]?.id) {
						if (direction === 'up' || direction === 'left') {
							moveToAdjacentApiary('prev')
						} else {
							moveToAdjacentApiary('next')
						}
						return
					}

					focusHive(nextHive)
				}
			}
		},
		[
			apiaryId,
			columnsPopupOpen,
			columnsPopupRef,
			effectiveListType,
			findNextListHive,
			focusHive,
			moveToAdjacentApiary,
			selectedHiveApiaryId,
			selectedHiveId,
			sortedHives,
		]
	)

	React.useEffect(() => {
		if (isLoading) {
			return () => {}
		}

		const handleGlobalKeyDown = (event) => {
			const activeElement = document.activeElement
			if (!rowRef.current || !activeElement) {
				return
			}

			const isInsideApiaryBlock =
				activeElement === rowRef.current ||
				rowRef.current.contains(activeElement)
			if (!isInsideApiaryBlock) {
				return
			}

			onRowKeyDown(event)
		}

		document.addEventListener('keydown', handleGlobalKeyDown, true)
		return () => {
			document.removeEventListener('keydown', handleGlobalKeyDown, true)
		}
	}, [isLoading, onRowKeyDown, rowRef])
}
