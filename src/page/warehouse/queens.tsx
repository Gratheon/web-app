import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useMutation, useQuery } from '@/api'
import { getUser } from '@/models/user'
import { SUPPORTED_LANGUAGES } from '@/config/languages'
import RefreshIcon from '@/icons/RefreshIcon'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import Modal from '@/shared/modal'
import T from '@/shared/translate'
import queenImageURL from '@/assets/queen.webp'
import { getQueenColorFromYear } from '@/page/hiveEdit/hiveTopInfo/queenColor/utils'
import QueenColorPicker from '@/shared/queenColorPicker'
import inputStyles from '@/shared/input/styles.module.less'
import styles from './queens.module.less'

type WarehouseQueen = {
	id: string
	name?: string | null
	race?: string | null
	added?: string | null
	color?: string | null
	lastHive?: {
		id: string
		hiveNumber?: number | null
	} | null
}

type SortColumn = 'NAME' | 'YEAR' | 'RACE' | 'COLOR'
type SortOrder = 'ASC' | 'DESC'

const RANDOM_QUEEN_NAME_QUERY = gql`
query RandomHiveName($language: String) {
	randomHiveName(language: $language)
}
`

const WAREHOUSE_QUEENS_QUERY = gql`
{
	warehouseQueens {
		id
		name
		race
		added
		color
		lastHive {
			id
			hiveNumber
		}
	}
	apiaries {
		id
		hives {
			id
		}
	}
}
`

const DELETE_WAREHOUSE_QUEEN_MUTATION = gql`
mutation deleteWarehouseQueen($familyId: ID!) {
	deleteWarehouseQueen(familyId: $familyId)
}
`

const ADD_WAREHOUSE_QUEEN_MUTATION = gql`
mutation addWarehouseQueen($queen: FamilyInput!) {
	addWarehouseQueen(queen: $queen) {
		id
		name
		race
		added
		color
	}
}
`

export default function WarehouseQueensPage() {
	const user = useLiveQuery(() => getUser(), [], null)
	const [lang, setLang] = useState('en')
	const { data, loading, error, reexecuteQuery } = useQuery(WAREHOUSE_QUEENS_QUERY)
	const {
		data: randomNameData,
		loading: randomNameLoading,
		reexecuteQuery: reexecuteRandomNameQuery,
	} = useQuery(RANDOM_QUEEN_NAME_QUERY, { variables: { language: lang } })
	const [deleteWarehouseQueen] = useMutation(DELETE_WAREHOUSE_QUEEN_MUTATION)
	const [addWarehouseQueen] = useMutation(ADD_WAREHOUSE_QUEEN_MUTATION)
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
	const [isCreating, setIsCreating] = useState(false)
	const [createError, setCreateError] = useState<string | null>(null)
	const [newQueenName, setNewQueenName] = useState('')
	const [newQueenRace, setNewQueenRace] = useState('')
	const [newQueenYear, setNewQueenYear] = useState(new Date().getFullYear().toString())
	const [newQueenColor, setNewQueenColor] = useState('')
	const [sortBy, setSortBy] = useState<SortColumn>('YEAR')
	const [sortOrder, setSortOrder] = useState<SortOrder>('DESC')
	const [selectedQueenId, setSelectedQueenId] = useState<string | null>(null)
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
	const [queenToDelete, setQueenToDelete] = useState<WarehouseQueen | null>(null)

	useEffect(() => {
		let currentLang = 'en'
		if (user?.lang) {
			currentLang = user.lang
		} else if (user === null) {
			const browserLang = navigator.language.substring(0, 2) as any
			if (SUPPORTED_LANGUAGES.includes(browserLang)) {
				currentLang = browserLang
			}
		}
		setLang(currentLang)
	}, [user])

	useEffect(() => {
		if (isCreateModalOpen && randomNameData?.randomHiveName && !randomNameLoading) {
			setNewQueenName(randomNameData.randomHiveName)
		}
	}, [isCreateModalOpen, randomNameData, randomNameLoading])

	const handleRefreshName = useCallback(() => {
		reexecuteRandomNameQuery({ requestPolicy: 'network-only' })
	}, [reexecuteRandomNameQuery])

	const queens: WarehouseQueen[] = data?.warehouseQueens || []
	const hiveToApiary = useMemo(() => {
		const nextMap: Record<string, string> = {}
		for (const apiary of data?.apiaries || []) {
			for (const hive of apiary?.hives || []) {
				if (hive?.id) {
					nextMap[String(hive.id)] = String(apiary.id)
				}
			}
		}
		return nextMap
	}, [data?.apiaries])
	const errorMessage = String(error?.message || '')
	const likelyBackendMismatch =
		errorMessage.includes('lastHive') || errorMessage.includes('family_moves')

	function onSort(nextSortBy: SortColumn) {
		if (sortBy === nextSortBy) {
			setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'))
			return
		}

		setSortBy(nextSortBy)
		setSortOrder('ASC')
	}

	function requestDeleteQueen(queen: WarehouseQueen) {
		setQueenToDelete(queen)
		setIsDeleteModalOpen(true)
	}

	async function onDeleteQueenConfirm() {
		if (!queenToDelete?.id) return

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

	function openCreateModal() {
		setCreateError(null)
		handleRefreshName()
		setNewQueenName('')
		setNewQueenRace('')
		setNewQueenYear(new Date().getFullYear().toString())
		setNewQueenColor('')
		setIsCreateModalOpen(true)
	}

	async function onCreateQueen() {
		setCreateError(null)
		const added = newQueenYear.trim()
		if (!/^\d{4}$/.test(added)) {
			setCreateError('Please provide a valid year (4 digits).')
			return
		}

		setIsCreating(true)
		const result = await addWarehouseQueen({
			queen: {
				name: newQueenName.trim() || null,
				race: newQueenRace.trim() || null,
				added,
				color: newQueenColor || null,
			},
		})
		setIsCreating(false)

		if (result?.data?.addWarehouseQueen?.id) {
			setIsCreateModalOpen(false)
			reexecuteQuery({ requestPolicy: 'network-only' })
			return
		}

		setCreateError('Failed to add queen to warehouse.')
	}

	const sortedQueens = useMemo(() => {
		const entries = [...queens]

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
	}, [queens, sortBy, sortOrder])

	useEffect(() => {
		if (sortedQueens.length === 0) {
			setSelectedQueenId(null)
			return
		}

		if (!selectedQueenId || !sortedQueens.some((queen) => queen.id === selectedQueenId)) {
			setSelectedQueenId(sortedQueens[0].id)
		}
	}, [sortedQueens, selectedQueenId])

	useEffect(() => {
		const isTypingTarget = (target: EventTarget | null) => {
			if (!target || !(target instanceof HTMLElement)) return false
			const tagName = String(target.tagName || '').toLowerCase()
			return (
				target.isContentEditable ||
				tagName === 'input' ||
				tagName === 'textarea' ||
				tagName === 'select'
			)
		}

		const onKeyDown = async (event: KeyboardEvent) => {
			if (isTypingTarget(event.target)) {
				return
			}

			if (isDeleteModalOpen) {
				if (deletingId) return

				if (event.key === 'Escape') {
					event.preventDefault()
					event.stopPropagation()
					setIsDeleteModalOpen(false)
					return
				}

				if (event.key === 'Enter') {
					event.preventDefault()
					event.stopPropagation()
					await onDeleteQueenConfirm()
				}
				return
			}

			if (isCreateModalOpen) {
				return
			}

			if (!sortedQueens.length) {
				return
			}

			if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
				event.preventDefault()
				event.stopPropagation()

				const currentIndex = sortedQueens.findIndex((queen) => queen.id === selectedQueenId)
				if (currentIndex === -1) {
					setSelectedQueenId(
						event.key === 'ArrowUp'
							? sortedQueens[sortedQueens.length - 1].id
							: sortedQueens[0].id
					)
					return
				}

				const nextIndex = event.key === 'ArrowUp'
					? Math.max(0, currentIndex - 1)
					: Math.min(sortedQueens.length - 1, currentIndex + 1)
				setSelectedQueenId(sortedQueens[nextIndex].id)
				return
			}

			if (event.key === 'Delete' || event.key === 'Del') {
				if (!selectedQueenId) return
				const selectedQueen = sortedQueens.find((queen) => queen.id === selectedQueenId)
				if (!selectedQueen) return
				event.preventDefault()
				event.stopPropagation()
				requestDeleteQueen(selectedQueen)
			}
		}

		document.addEventListener('keydown', onKeyDown, true)
		return () => {
			document.removeEventListener('keydown', onKeyDown, true)
		}
	}, [deletingId, isCreateModalOpen, isDeleteModalOpen, selectedQueenId, sortedQueens, queenToDelete])

	if (loading) {
		return <Loader />
	}

	const sortArrow = (column: SortColumn) => {
		if (sortBy !== column) {
			return ''
		}
		return sortOrder === 'ASC' ? ' ↑' : ' ↓'
	}

	return (
		<div className={styles.page}>
			<div className={styles.headerRow}>
				<h2><T>Warehouse Queens</T></h2>
				<Button color="green" size="small" onClick={openCreateModal}>
					<T>Add Queen</T>
				</Button>
			</div>
			<p className={styles.description}>
				<T>Queens stored in warehouse and not assigned to any hive.</T>
			</p>
			<ErrorMsg error={error} />

				{sortedQueens.length === 0 && !error ? (
					<div className={styles.empty}>
						<img src={queenImageURL} alt="Queen placeholder" className={styles.emptyImage} draggable={false} />
						<T>No queens stored in warehouse.</T>
					</div>
				) : null}

				{sortedQueens.length === 0 && !!error ? (
					<div className={styles.empty}>
						<T>Unable to load warehouse queens.</T>
						{likelyBackendMismatch ? (
							<div className={styles.hint}>Backend schema/migrations may be outdated.</div>
						) : null}
					</div>
				) : null}

				{sortedQueens.length > 0 ? (
					<div className={styles.tableWrap}>
							<table className={styles.table}>
							<thead>
								<tr>
									<th className={`${styles.sortable} ${styles.colorColumn}`} onClick={() => onSort('COLOR')}><T>Color</T>{sortArrow('COLOR')}</th>
									<th className={styles.sortable} onClick={() => onSort('NAME')}><T>Queen</T>{sortArrow('NAME')}</th>
									<th className={styles.sortable} onClick={() => onSort('YEAR')}><T>Year</T>{sortArrow('YEAR')}</th>
									<th className={styles.sortable} onClick={() => onSort('RACE')}><T>Race</T>{sortArrow('RACE')}</th>
									<th><T>Last hive</T></th>
									<th className={styles.actionsColumn}><T>Actions</T></th>
								</tr>
							</thead>
							<tbody>
									{sortedQueens.map((queen) => {
										const color = queen.color || getQueenColorFromYear(queen.added || '')
										const apiaryId = queen.lastHive?.id ? hiveToApiary[String(queen.lastHive.id)] : null
										return (
										<tr
											key={queen.id}
											className={selectedQueenId === queen.id ? styles.selectedRow : ''}
											onMouseEnter={() => setSelectedQueenId(queen.id)}
											onClick={() => setSelectedQueenId(queen.id)}
										>
											<td className={styles.colorColumn}>
												<div className={styles.colorCell}>
													<span className={styles.colorDot} style={{ backgroundColor: color }}></span>
												</div>
											</td>
											<td>{queen.name || <T>Unnamed Queen</T>}</td>
											<td>{queen.added || '-'}</td>
											<td>{queen.race || <T>Race unknown</T>}</td>
												<td>
													{apiaryId && queen.lastHive?.id ? (
														<Link
															className={styles.hiveLink}
															to={`/apiaries/${apiaryId}/hives/${queen.lastHive.id}`}
														>
															{queen.lastHive.hiveNumber ? `#${queen.lastHive.hiveNumber}` : `ID ${queen.lastHive.id}`}
														</Link>
												) : (
													'-'
												)}
											</td>
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
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
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

			{isCreateModalOpen ? (
				<Modal title={<T>Add Queen</T>} onClose={() => setIsCreateModalOpen(false)}>
					<div className={styles.modalContent}>
						<ErrorMsg error={createError} />

						<div className={styles.nameInputWrapper}>
							<div style={{ flex: 1 }}>
								<label className={inputStyles.label}><T>Queen Name</T></label>
								<input
									className={inputStyles.input}
									type="text"
									value={newQueenName}
									onChange={(e: any) => setNewQueenName(e.target.value)}
									placeholder="Enter queen name"
									autoFocus
								/>
							</div>
							<Button
								type="button"
								onClick={handleRefreshName}
								disabled={randomNameLoading}
								style={{
									marginTop: '24px',
									height: '40px',
									minWidth: '40px',
									padding: '0 12px',
								}}
								title="Get new name suggestion"
							>
								<RefreshIcon />
							</Button>
						</div>

						<label className={inputStyles.label}><T>Race</T></label>
						<input
							className={inputStyles.input}
							type="text"
							value={newQueenRace}
							onChange={(e: any) => setNewQueenRace(e.target.value)}
							placeholder="e.g. Carniolan, Italian, etc."
						/>

						<label className={inputStyles.label}><T>Year</T></label>
						<input
							className={inputStyles.input}
							type="text"
							maxLength={4}
							value={newQueenYear}
							onChange={(e: any) => setNewQueenYear(e.target.value)}
							placeholder="YYYY"
						/>

						<label className={inputStyles.label}><T>Color (optional)</T></label>
						<QueenColorPicker
							year={newQueenYear}
							color={newQueenColor || null}
							onColorChange={(value: string) => setNewQueenColor(value)}
						/>

						<div className={styles.modalActions}>
							<Button size="small" onClick={() => setIsCreateModalOpen(false)}>
								<T>Cancel</T>
							</Button>
							<Button size="small" color="green" onClick={onCreateQueen} loading={isCreating}>
								<T>Add to Warehouse</T>
							</Button>
						</div>
					</div>
				</Modal>
			) : null}
			</div>
	)
}
