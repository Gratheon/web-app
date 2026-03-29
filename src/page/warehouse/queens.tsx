import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useMutation, useQuery } from '@/api'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import Modal from '@/shared/modal'
import T from '@/shared/translate'
import ListIcon from '@/icons/listIcon'
import TableIcon from '@/icons/tableIcon'
import queenImageURL from '@/assets/queen.webp'
import queenPlaceholderUrls from '@/assets/queens/placeholders'
import { getQueenColorFromYear } from '@/page/hiveEdit/hiveTopInfo/queenColor/utils'
import { getAllFamilies, getAssignedFamilies, getFamiliesByIds, getUnassignedFamilies } from '@/models/family'
import { getHivesByIds } from '@/models/hive'
import styles from './queens.module.less'

type HiveLink = {
	apiaryId: string
	hiveId: string
	hiveNumber?: number | null
}

type LastDetectedLink = {
	frameId: string
	frameSideId: string
	boxId: string
	fileId?: string
}

type QueenItem = {
	id: string
	name?: string | null
	race?: string | null
	added?: string | null
	color?: string | null
	parentId?: string | null
	previewImageUrl?: string | null
	section: 'IN_HIVES' | 'WAREHOUSE'
	hive?: HiveLink | null
	lastDetected?: LastDetectedLink | null
	lastHive?: {
		id: string
		hiveNumber?: number | null
	} | null
}

type SortColumn = 'NAME' | 'YEAR' | 'RACE' | 'COLOR'
type SortOrder = 'ASC' | 'DESC'
type ViewMode = 'LIST' | 'TABLE'

function hashString(value: string): number {
	let hash = 0
	for (let i = 0; i < value.length; i++) {
		hash = ((hash << 5) - hash) + value.charCodeAt(i)
		hash |= 0
	}
	return Math.abs(hash)
}

function getRandomQueenPlaceholder(seed: string): string {
	if (!queenPlaceholderUrls.length) return queenImageURL
	const index = hashString(seed) % queenPlaceholderUrls.length
	return queenPlaceholderUrls[index]
}

const QUEENS_QUERY = gql`
{
	warehouseQueens {
		id
		name
		race
		added
		color
	}
}
`

const DELETE_WAREHOUSE_QUEEN_MUTATION = gql`
mutation deleteWarehouseQueen($familyId: ID!) {
	deleteWarehouseQueen(familyId: $familyId)
}
`

function sortQueens(items: QueenItem[], sortBy: SortColumn, sortOrder: SortOrder): QueenItem[] {
	const entries = [...items]
	entries.sort((a, b) => {
		const aName = (a.name || '').trim()
		const bName = (b.name || '').trim()
		const aRace = (a.race || '').trim()
		const bRace = (b.race || '').trim()
		const aYear = Number.parseInt(a.added || '', 10)
		const bYear = Number.parseInt(b.added || '', 10)
		const aColor = (a.color || getQueenColorFromYear(a.added || '') || '').toLowerCase()
		const bColor = (b.color || getQueenColorFromYear(b.added || '') || '').toLowerCase()

		let compareValue = 0
		switch (sortBy) {
		case 'NAME':
			compareValue = aName.localeCompare(bName, undefined, { sensitivity: 'base' })
			break
		case 'RACE':
			compareValue = aRace.localeCompare(bRace, undefined, { sensitivity: 'base' })
			break
		case 'YEAR': {
			const aHasYear = Number.isFinite(aYear)
			const bHasYear = Number.isFinite(bYear)
			if (!aHasYear && !bHasYear) {
				compareValue = 0
			} else if (!aHasYear) {
				compareValue = 1
			} else if (!bHasYear) {
				compareValue = -1
			} else {
				compareValue = aYear - bYear
			}
			break
		}
		case 'COLOR':
			compareValue = aColor.localeCompare(bColor, undefined, { sensitivity: 'base' })
			break
		default:
			compareValue = 0
		}

		if (compareValue === 0) {
			return aName.localeCompare(bName, undefined, { sensitivity: 'base' })
		}

		return sortOrder === 'ASC' ? compareValue : -compareValue
	})
	return entries
}

export default function WarehouseQueensPage() {
	const { data, loading, error, reexecuteQuery } = useQuery(QUEENS_QUERY)
	const [deleteWarehouseQueen] = useMutation(DELETE_WAREHOUSE_QUEEN_MUTATION)
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const [sortBy, setSortBy] = useState<SortColumn>('YEAR')
	const [sortOrder, setSortOrder] = useState<SortOrder>('DESC')
	const [viewMode, setViewMode] = useState<ViewMode>('LIST')
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [queenToDelete, setQueenToDelete] = useState<QueenItem | null>(null)
	const [queenForAncestry, setQueenForAncestry] = useState<QueenItem | null>(null)

	const assignedFamilies = useLiveQuery(() => getAssignedFamilies(), [], [])
	const unassignedFamilies = useLiveQuery(() => getUnassignedFamilies(), [], [])
	const allFamilies = useLiveQuery(() => getAllFamilies(), [], [])

	const hiveIds = useMemo(() => {
		const ids: number[] = []
		for (const family of assignedFamilies || []) {
			const hiveId = Number(family?.hiveId)
			if (Number.isFinite(hiveId) && hiveId > 0) ids.push(hiveId)
		}
		return Array.from(new Set(ids))
	}, [assignedFamilies])

	const localHives = useLiveQuery(
		() => getHivesByIds(hiveIds),
		[hiveIds.join(',')],
		[]
	)

	const hiveById = useMemo(() => {
		const map = new Map<string, any>()
		for (const hive of localHives || []) {
			if (!hive?.id) continue
			map.set(String(hive.id), hive)
		}
		return map
	}, [localHives])

	const familyIds = useMemo(() => {
		const ids: number[] = []
		for (const queen of data?.warehouseQueens || []) {
			const id = Number(queen?.id)
			if (Number.isFinite(id) && id > 0) ids.push(id)
		}
		for (const family of assignedFamilies || []) {
			const id = Number(family?.id)
			if (Number.isFinite(id) && id > 0) ids.push(id)
		}
		return Array.from(new Set(ids))
	}, [assignedFamilies, data?.warehouseQueens])

	const localFamilies = useLiveQuery(
		() => getFamiliesByIds(familyIds),
		[familyIds.join(',')],
		[]
	)

	const localPreviewByFamilyId = useMemo(() => {
		const map = new Map<string, string>()
		for (const family of localFamilies || []) {
			if (!family?.id || !family?.previewImageUrl) continue
			map.set(String(family.id), String(family.previewImageUrl))
		}
		return map
	}, [localFamilies])

	const inHiveQueens = useMemo(() => {
		const items: QueenItem[] = []
		for (const family of assignedFamilies || []) {
			if (!family?.id || !family?.hiveId) continue
			const hiveId = String(family.hiveId)
			const hive = hiveById.get(hiveId)
			const apiaryId = String(hive?.apiaryId || hive?.apiary_id || '')
			const lastDetected = (
				family.lastSeenFrameId && family.lastSeenFrameSideId && family.lastSeenBoxId
			) ? {
				frameId: String(family.lastSeenFrameId),
				frameSideId: String(family.lastSeenFrameSideId),
				boxId: String(family.lastSeenBoxId),
			} : null
			items.push({
				id: String(family.id),
				name: family.name,
				race: family.race,
				added: family.added,
				color: family.color,
				parentId: family.parentId != null ? String(family.parentId) : null,
				previewImageUrl: family.previewImageUrl || localPreviewByFamilyId.get(String(family.id)),
				section: 'IN_HIVES',
				hive: {
					apiaryId,
					hiveId,
					hiveNumber: hive?.hiveNumber,
				},
				lastDetected,
			})
		}
		return sortQueens(items, sortBy, sortOrder)
	}, [assignedFamilies, hiveById, localPreviewByFamilyId, sortBy, sortOrder])

	const warehouseQueens = useMemo(() => {
		const byId = new Map<string, QueenItem>()
		for (const queen of data?.warehouseQueens || []) {
			const id = String(queen.id)
			byId.set(id, {
				id,
				name: queen.name,
				race: queen.race,
				added: queen.added,
				color: queen.color,
				parentId: queen.parentId != null ? String(queen.parentId) : null,
				previewImageUrl: localPreviewByFamilyId.get(id),
				section: 'WAREHOUSE',
				lastHive: queen.lastHive,
			})
		}
		for (const family of unassignedFamilies || []) {
			const id = String(family.id)
			if (byId.has(id)) continue
			byId.set(id, {
				id,
				name: family.name,
				race: family.race,
				added: family.added,
				color: family.color,
				parentId: family.parentId != null ? String(family.parentId) : null,
				previewImageUrl: family.previewImageUrl || localPreviewByFamilyId.get(id),
				section: 'WAREHOUSE',
			})
		}
		const items = Array.from(byId.values())
		return sortQueens(items, sortBy, sortOrder)
	}, [data?.warehouseQueens, localPreviewByFamilyId, sortBy, sortOrder, unassignedFamilies])

	const queenById = useMemo(() => {
		const byId = new Map<string, QueenItem>()
		for (const queen of inHiveQueens) {
			byId.set(String(queen.id), queen)
		}
		for (const queen of warehouseQueens) {
			if (!byId.has(String(queen.id))) {
				byId.set(String(queen.id), queen)
			}
		}
		for (const family of allFamilies || []) {
			const id = String(family?.id || '')
			if (!id) continue
			if (byId.has(id)) continue
			byId.set(id, {
				id,
				name: family?.name,
				race: family?.race,
				added: family?.added,
				color: family?.color,
				parentId: family?.parentId != null ? String(family.parentId) : null,
				previewImageUrl: family?.previewImageUrl || null,
				section: 'WAREHOUSE',
			})
		}
		return byId
	}, [allFamilies, inHiveQueens, warehouseQueens])

	const ancestryChain = useMemo(() => {
		if (!queenForAncestry) return []
		const chain: QueenItem[] = []
		const visited = new Set<string>()
		let current: QueenItem | null | undefined = queenForAncestry
		for (let depth = 0; depth < 20 && current; depth++) {
			const id = String(current.id)
			if (visited.has(id)) break
			visited.add(id)
			chain.push(current)
			const parentId = current.parentId ? String(current.parentId) : ''
			if (!parentId) break
			const knownParent = queenById.get(parentId)
			if (!knownParent) {
				chain.push({
					id: parentId,
					name: `#${parentId}`,
					race: null,
					added: null,
					parentId: null,
					section: 'WAREHOUSE',
				})
				break
			}
			current = knownParent
		}
		return chain
	}, [queenById, queenForAncestry])

	const errorMessage = String(error?.message || '')
	const likelyBackendMismatch =
		errorMessage.includes('lastHive') || errorMessage.includes('family_moves') || errorMessage.includes('previewImageUrl')

	function onSort(nextSortBy: SortColumn) {
		if (sortBy === nextSortBy) {
			setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))
			return
		}

		setSortBy(nextSortBy)
		setSortOrder('ASC')
	}

	function requestDeleteQueen(queen: QueenItem) {
		setQueenToDelete(queen)
		setIsDeleteModalOpen(true)
	}

	async function onDeleteQueenConfirm() {
		if (!queenToDelete?.id || deletingId) return

		setIsDeleteModalOpen(false)
		setDeletingId(queenToDelete.id)
		const result = await deleteWarehouseQueen({
			familyId: queenToDelete.id,
		})
		setDeletingId(null)

		if (result?.data?.deleteWarehouseQueen) {
			reexecuteQuery({ requestPolicy: 'network-only' })
		}
	}

	useEffect(() => {
		if (!isDeleteModalOpen || !queenToDelete || deletingId) return

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Enter') return
			event.preventDefault()
			void onDeleteQueenConfirm()
		}

		document.addEventListener('keydown', onKeyDown)
		return () => {
			document.removeEventListener('keydown', onKeyDown)
		}
	}, [isDeleteModalOpen, queenToDelete, deletingId, onDeleteQueenConfirm])

	if (loading) {
		return <Loader />
	}

	const sortArrow = (column: SortColumn) => {
		if (sortBy !== column) {
			return ''
		}
		return sortOrder === 'ASC' ? ' ↑' : ' ↓'
	}

	const renderHiveLink = (queen: QueenItem) => {
		if (queen.section === 'IN_HIVES' && queen.hive) {
			if (!queen.hive.apiaryId) {
				return queen.hive.hiveNumber ? `#${queen.hive.hiveNumber}` : `ID ${queen.hive.hiveId}`
			}
			return (
				<Link className={styles.hiveLink} to={`/apiaries/${queen.hive.apiaryId}/hives/${queen.hive.hiveId}`}>
					{queen.hive.hiveNumber ? `#${queen.hive.hiveNumber}` : `ID ${queen.hive.hiveId}`}
				</Link>
			)
		}

		if (queen.lastHive?.id) {
			return queen.lastHive.hiveNumber ? `#${queen.lastHive.hiveNumber}` : `ID ${queen.lastHive.id}`
		}

		return '-'
	}

	const renderFrameLink = (queen: QueenItem) => {
		if (!queen.hive || !queen.hive.apiaryId || !queen.lastDetected) return <T>Not marked yet</T>
		return (
			<Link
				className={styles.frameLink}
				to={`/apiaries/${queen.hive.apiaryId}/hives/${queen.hive.hiveId}/box/${queen.lastDetected.boxId}/frame/${queen.lastDetected.frameId}/${queen.lastDetected.frameSideId}`}
			>
				<T>Open frame</T>
			</Link>
		)
	}

	const renderQueenName = (queen: QueenItem) => {
		if (!queen.parentId) {
			return queen.name || <T>Unnamed Queen</T>
		}
		return (
			<a
				href="#"
				className={styles.queenNameButton}
				onClick={(event) => {
					event.preventDefault()
					setQueenForAncestry(queen)
				}}
			>
				{queen.name || <T>Unnamed Queen</T>}
			</a>
		)
	}

	const renderTableSection = (title: string, items: QueenItem[], allowDelete: boolean) => (
		<div className={styles.section}>
			<h3 className={styles.sectionTitle}><T>{title}</T> ({items.length})</h3>
			{items.length === 0 ? (
				<div className={styles.emptySection}><T>No queens in this section.</T></div>
			) : (
				<div className={styles.tableWrap}>
					<table className={styles.table}>
						<thead>
							<tr>
								<th className={`${styles.sortable} ${styles.colorColumn}`} onClick={() => onSort('COLOR')}><T>Color</T>{sortArrow('COLOR')}</th>
								<th className={styles.sortable} onClick={() => onSort('NAME')}><T>Queen</T>{sortArrow('NAME')}</th>
								<th className={styles.sortable} onClick={() => onSort('YEAR')}><T>Year</T>{sortArrow('YEAR')}</th>
								<th className={styles.sortable} onClick={() => onSort('RACE')}><T>Race</T>{sortArrow('RACE')}</th>
								<th><T>Hive</T></th>
								<th><T>Last detected frame</T></th>
								{allowDelete ? <th className={styles.actionsColumn}><T>Actions</T></th> : null}
							</tr>
						</thead>
						<tbody>
							{items.map((queen) => {
								const color = queen.color || getQueenColorFromYear(queen.added || '')
								return (
									<tr key={`${queen.section}-${queen.id}`}>
										<td className={styles.colorColumn}>
											<div className={styles.colorCell}>
												<span className={styles.colorDot} style={{ backgroundColor: color }}></span>
											</div>
										</td>
										<td>{renderQueenName(queen)}</td>
										<td>{queen.added || '-'}</td>
										<td>{queen.race || <T>Race unknown</T>}</td>
										<td>{renderHiveLink(queen)}</td>
										<td>{renderFrameLink(queen)}</td>
										{allowDelete ? (
											<td className={styles.actionsColumn}>
												<Button
													size="small"
													color="red"
													loading={deletingId === queen.id}
													onClick={() => requestDeleteQueen(queen)}
												>
													<T>Delete</T>
												</Button>
											</td>
										) : null}
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)

	const renderListSection = (title: string, items: QueenItem[], allowDelete: boolean) => (
		<div className={styles.section}>
			<h3 className={styles.sectionTitle}><T>{title}</T> ({items.length})</h3>
			{items.length === 0 ? (
				<div className={styles.emptySection}><T>No queens in this section.</T></div>
			) : (
				<div className={styles.cardsGrid}>
					{items.map((queen) => {
						const color = queen.color || getQueenColorFromYear(queen.added || '')
						const hasRealPreview = Boolean(queen.previewImageUrl)
						const imageSrc = hasRealPreview
							? String(queen.previewImageUrl)
							: getRandomQueenPlaceholder(`${queen.id}-${queen.name || ''}-${queen.added || ''}`)
						return (
							<div className={styles.card} key={`${queen.section}-${queen.id}`}>
								<div className={`${styles.cardImageWrap} ${hasRealPreview ? styles.cardImageWrapPreview : ''}`}>
									<img
										src={imageSrc}
										alt={queen.name || 'Queen'}
										className={`${styles.cardImage} ${hasRealPreview ? styles.cardImagePreview : styles.cardImagePlaceholder}`}
										style={hasRealPreview ? { borderColor: color } : undefined}
										draggable={false}
									/>
								</div>
								<div className={styles.cardContent}>
									<div className={styles.cardTitleRow}>
										<span className={styles.colorDot} style={{ backgroundColor: color }}></span>
										<strong>{renderQueenName(queen)}</strong>
									</div>
									<div className={styles.cardMeta}><T>Year</T>: {queen.added || '-'}</div>
									<div className={styles.cardMeta}><T>Race</T>: {queen.race || <T>Race unknown</T>}</div>
									<div className={styles.cardMeta}><T>Hive</T>: {renderHiveLink(queen)}</div>
									<div className={styles.cardMeta}><T>Last detected frame</T>: {renderFrameLink(queen)}</div>
								</div>
								{allowDelete ? (
									<div className={styles.cardActions}>
										<Button
											size="small"
											color="red"
											loading={deletingId === queen.id}
											onClick={() => requestDeleteQueen(queen)}
										>
											<T>Delete</T>
										</Button>
									</div>
								) : null}
							</div>
						)
					})}
				</div>
			)}
		</div>
	)

	const hasAnyQueens = inHiveQueens.length > 0 || warehouseQueens.length > 0

	return (
		<div className={styles.page}>
			<div className={styles.headerRow}>
				<h2><T>Queens</T></h2>
				<div className={styles.headerActions}>
					<Button
						size="small"
						style={viewMode === 'LIST' ? { opacity: 1 } : { opacity: 0.8 }}
						onClick={() => setViewMode('LIST')}
					>
						<ListIcon size={14} />
						<T>List</T>
					</Button>
					<Button
						size="small"
						style={viewMode === 'TABLE' ? { opacity: 1 } : { opacity: 0.8 }}
						onClick={() => setViewMode('TABLE')}
					>
						<TableIcon size={14} />
						<T>Table</T>
					</Button>
					<Button color="green" href="/warehouse/queens/create">
						<T>Add Queen</T>
					</Button>
				</div>
			</div>
			<p className={styles.description}>
				<T>Browse queens in active hives and in warehouse storage. Open last detected frame to jump directly into hive frame view.</T>
			</p>
			<p className={styles.previewHint}>
				<T>Tip: mark the queen on a frame in canvas view, and that marked area will be shown here as the queen preview image.</T>
			</p>
			<ErrorMsg error={error} />

			{!hasAnyQueens && !error ? (
				<div className={styles.empty}>
					<img src={queenImageURL} alt="Queen placeholder" className={styles.emptyImage} draggable={false} />
					<T>No queens available yet.</T>
				</div>
			) : null}

			{!hasAnyQueens && !!error ? (
				<div className={styles.empty}>
					<T>Unable to load queens.</T>
					{likelyBackendMismatch ? (
						<div className={styles.hint}>Backend schema/migrations may be outdated.</div>
					) : null}
				</div>
			) : null}

			{hasAnyQueens ? (
				<>
					{viewMode === 'TABLE' ? (
						<>
							{renderTableSection('Queens in hives', inHiveQueens, false)}
							{renderTableSection('Warehouse queens', warehouseQueens, true)}
						</>
					) : (
						<>
							{renderListSection('Queens in hives', inHiveQueens, false)}
							{renderListSection('Warehouse queens', warehouseQueens, true)}
						</>
					)}
				</>
			) : null}

			{isDeleteModalOpen && queenToDelete ? (
				<Modal title={<T>Delete Queen</T>} onClose={() => setIsDeleteModalOpen(false)}>
					<div className={styles.modalContent}>
						<div style={{ marginBottom: '12px' }}>
							<T>Delete this queen from warehouse?</T>
						</div>
						<div className={styles.modalActionsWithHints}>
							<div className={styles.actionWithHint}>
								<Button size="small" color="gray" onClick={() => setIsDeleteModalOpen(false)}>
									<T>Cancel</T>
								</Button>
								<div className={styles.keyHint}>Esc</div>
							</div>
							<div className={styles.actionWithHint}>
								<Button
									size="small"
									color="red"
									loading={deletingId === queenToDelete.id}
									onClick={onDeleteQueenConfirm}
								>
									<T>Delete</T>
								</Button>
								<div className={styles.keyHint}>Enter</div>
							</div>
						</div>
					</div>
				</Modal>
			) : null}

			{queenForAncestry?.parentId ? (
				<Modal title={<T>Queen ancestry</T>} onClose={() => setQueenForAncestry(null)}>
					<div className={styles.ancestryWrap}>
						{ancestryChain.map((queen, index) => (
							<div key={`${queen.id}-${index}`} className={styles.ancestryNodeWrap}>
								<div className={styles.ancestryNode}>
									<div className={styles.ancestryNodeTitle}>{queen.name || <T>Unnamed Queen</T>}</div>
									<div className={styles.ancestryNodeMeta}><T>Race</T>: {queen.race || <T>Race unknown</T>}</div>
									<div className={styles.ancestryNodeMeta}><T>Year</T>: {queen.added || '-'}</div>
								</div>
								{index < ancestryChain.length - 1 ? <div className={styles.ancestryArrow}>↑</div> : null}
							</div>
						))}
					</div>
				</Modal>
			) : null}
		</div>
	)
}
