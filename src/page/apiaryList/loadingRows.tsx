import React from 'react'

import ApiaryListRow from './apiaryListRow'

function getPreferredSkeletonListType() {
	if (typeof window === 'undefined') {
		return 'list'
	}

	try {
		for (let i = 0; i < localStorage.length; i += 1) {
			const key = localStorage.key(i)
			if (!key?.startsWith('apiaryListType.')) {
				continue
			}

			if (localStorage.getItem(key) === 'table') {
				return 'table'
			}
		}
	} catch (error) {
		console.error('Failed to inspect stored apiary list type', error)
	}

	return 'list'
}

function buildLoadingApiaries() {
	return [
		{
			id: 'loading-apiary-1',
			name: '',
			type: 'STATIC',
			hives: Array.from({ length: 6 }, (_, index) => ({ id: `loading-1-${index + 1}` })),
		},
		{
			id: 'loading-apiary-2',
			name: '',
			type: 'MOBILE',
			hives: Array.from({ length: 4 }, (_, index) => ({ id: `loading-2-${index + 1}` })),
		},
		{
			id: 'loading-apiary-3',
			name: '',
			type: 'STATIC',
			hives: Array.from({ length: 5 }, (_, index) => ({ id: `loading-3-${index + 1}` })),
		},
	]
}

export default function ApiaryListLoadingRows({
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
}: {
	user: any
	sortBy: string
	sortOrder: string
	onSortChange: (sortBy: string) => void
	visibleColumns: string[]
	onToggleColumn: (columnKey: string) => void
	selectedHiveApiaryId: string | number | null
	selectedHiveId: string | number | null
	onSelectHive: (apiaryId: string | number | null, hiveId: string | number | null, options?: { focus: boolean }) => void
	onNavigateAcrossApiaries: ({ apiaryId, direction }: { apiaryId: string | number | null, direction: string }) => void
}) {
	const [loadingSkeletonListType] = React.useState<'list' | 'table'>(() => getPreferredSkeletonListType() as 'list' | 'table')
	const loadingApiaries = React.useMemo(() => buildLoadingApiaries(), [])

	return (
		<>
			{loadingApiaries.map((apiary, i) => (
				<ApiaryListRow
					key={i}
					apiary={apiary}
					boxSystems={[]}
					user={user}
					sortBy={sortBy}
					sortOrder={sortOrder}
					onSortChange={onSortChange}
					visibleColumns={visibleColumns}
					onToggleColumn={onToggleColumn}
					selectedHiveApiaryId={selectedHiveApiaryId}
					selectedHiveId={selectedHiveId}
					onSelectHive={onSelectHive}
					onNavigateAcrossApiaries={onNavigateAcrossApiaries}
					hasMixedApiaryTypes={true}
					isLoading={true}
					forcedListType={loadingSkeletonListType}
				/>
			))}
		</>
	)
}
