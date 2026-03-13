import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { gql, useQuery } from '@/api'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import T from '@/shared/translate'
import { getQueenColorFromYear } from '@/page/hiveEdit/hiveTopInfo/queenColor/utils'
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

export default function WarehouseQueensPage() {
	const { data, loading, error } = useQuery(WAREHOUSE_QUEENS_QUERY)
	const [sortBy, setSortBy] = useState<SortColumn>('YEAR')
	const [sortOrder, setSortOrder] = useState<SortOrder>('DESC')

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
			<h2><T>Warehouse Queens</T></h2>
			<p className={styles.description}>
				<T>Queens stored in warehouse and not assigned to any hive.</T>
			</p>
			<ErrorMsg error={error} />

				{sortedQueens.length === 0 && !error ? (
					<div className={styles.empty}><T>No queens stored in warehouse.</T></div>
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
								</tr>
							</thead>
							<tbody>
									{sortedQueens.map((queen) => {
										const color = queen.color || getQueenColorFromYear(queen.added || '')
										const apiaryId = queen.lastHive?.id ? hiveToApiary[String(queen.lastHive.id)] : null
										return (
										<tr key={queen.id}>
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
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				) : null}
			</div>
	)
}
