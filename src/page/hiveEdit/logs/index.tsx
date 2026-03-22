import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import Button from '@/shared/button'
import DateTimeFormat from '@/shared/dateTimeFormat'
import T, { useTranslation as t } from '@/shared/translate'
import TrashIcon from '@/icons/trashIcon'
import SkullIcon from '@/icons/SkullIcon'
import UpIcon from '@/icons/upIcon'
import DownIcon from '@/icons/downIcon'
import LeftChevron from '@/icons/leftChevron'
import RightChevron from '@/icons/rightChevron'
import QueenIcon from '@/icons/queenIcon'
import FramesIcon from '@/icons/framesIcon'
import FoundationIcon from '@/icons/foundationIcon'
import EmptyFrameIcon from '@/icons/emptyFrameIcon'
import {
	addManualHiveLogEntry,
	deleteHiveLogEntry,
	listHiveLogs,
	updateHiveLogEntry,
	HiveLogEntry,
	syncHiveLogsFromBackend,
} from '@/models/hiveLog'

import styles from './styles.module.less'

type TimelineRow = {
	key: string
	entry: HiveLogEntry
	splitChild: boolean
	splitChildLinked: boolean
	mergeReceive: boolean
}

type TimelineDisplayItem =
	| { kind: 'entry'; row: TimelineRow }
	| { kind: 'group'; key: string; rows: TimelineRow[] }

const LOG_PAGE_SIZE = 50

function LabVialIcon({ size = 10 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
			<path
				d="M9 3h6M10 3v5l-4.7 7.6A4 4 0 0 0 8.7 21h6.6a4 4 0 0 0 3.4-5.4L14 8V3"
				fill="none"
				stroke="white"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path d="M8 15h8" stroke="white" strokeWidth="2" strokeLinecap="round" />
		</svg>
	)
}

function GrowthIcon({ size = 10 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
			<path d="M12 20v-7" stroke="white" strokeWidth="2" strokeLinecap="round" />
			<path d="M12 13c0-3 2.5-5.5 5.5-5.5 0 3-2.5 5.5-5.5 5.5Z" fill="white" />
			<path d="M12 15c0-2.8-2.2-5-5-5 0 2.8 2.2 5 5 5Z" fill="white" />
		</svg>
	)
}

export default function HiveLogs({ hiveId, apiaryId }: { hiveId: string; apiaryId: string }) {
	const numericHiveId = +hiveId
	const tSectionRemoved = t('Section removed')
	const tFrameAdded = t('Frame added')
	const tSectionMovedDown = t('Section moved down')
	const tSectionAdded = t('Section added')
	const tNewQueenIntroduced = t('New queen introduced')
	const tColonySplitChildAdded = t('This colony was split and child colony was added to a new hive')
	const tFrameRearranged = t('Frame rearranged')
	const tSectionMovedUp = t('Section moved up')

	const titleTranslations = useMemo(() => new Map<string, string>([
		['Section removed', tSectionRemoved],
		['Frame added', tFrameAdded],
		['Section moved down', tSectionMovedDown],
		['Section added', tSectionAdded],
		['New queen introduced', tNewQueenIntroduced],
		['This colony was split and child colony was added to a new hive', tColonySplitChildAdded],
		['Frame rearranged', tFrameRearranged],
		['Section moved up', tSectionMovedUp],
	]), [
		tSectionRemoved,
		tFrameAdded,
		tSectionMovedDown,
		tSectionAdded,
		tNewQueenIntroduced,
		tColonySplitChildAdded,
		tFrameRearranged,
		tSectionMovedUp,
	])

	const titleCanonicalByLower = useMemo(() => {
		const map = new Map<string, string>()
		for (const [canonical, localized] of titleTranslations.entries()) {
			map.set(canonical.toLowerCase(), canonical)
			map.set(localized.toLowerCase(), canonical)
		}
		return map
	}, [titleTranslations])

	const logs = useLiveQuery(() => listHiveLogs(numericHiveId), [numericHiveId], null)
	const [draft, setDraft] = useState('')
	const [editingId, setEditingId] = useState<number | null>(null)
	const [editTitle, setEditTitle] = useState('')
	const [editDetails, setEditDetails] = useState('')
	const [visibleCount, setVisibleCount] = useState(LOG_PAGE_SIZE)
	const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

	useEffect(() => {
		syncHiveLogsFromBackend(numericHiveId).catch((e) =>
			console.error('Failed to sync hive logs in view', e)
		)
	}, [numericHiveId])

	useEffect(() => {
		setVisibleCount(LOG_PAGE_SIZE)
		setExpandedGroups({})
	}, [numericHiveId])

	if (logs === null) {
		return null
	}

	function canonicalizeTitle(rawTitle: string): string {
		const normalized = (rawTitle || '').trim().toLowerCase()
		return titleCanonicalByLower.get(normalized) || rawTitle
	}

	function getDisplayTitle(rawTitle: string): string {
		const canonical = canonicalizeTitle(rawTitle)
		return titleTranslations.get(canonical) || rawTitle
	}

	function isSplitSourceEntry(entry: HiveLogEntry): boolean {
		return (
			entry.action === 'LINEAGE' &&
			/^hive(\s+\d+)?\s+was split$/i.test((entry.title || '').trim()) &&
			Array.isArray(entry.relatedHives) &&
			entry.relatedHives.length > 0
		)
	}

	function isSplitChildEntry(entry: HiveLogEntry): boolean {
		return (
			entry.action === 'LINEAGE' &&
			((entry.dedupeKey || '').startsWith('lineage:child:') ||
				/created a child hive/i.test(entry.title || '') ||
				/colony was split and child colony was added to a new hive/i.test(entry.title || '')) &&
			Array.isArray(entry.relatedHives) &&
			entry.relatedHives.length > 0
		)
	}

	function isMergeReceiveEntry(entry: HiveLogEntry): boolean {
		return (
			entry.action === 'LINEAGE' &&
			/received merged colony/i.test(entry.title || '') &&
			Array.isArray(entry.relatedHives) &&
			entry.relatedHives.length > 0
		)
	}

	function isRedundantSplitFromEntry(entry: HiveLogEntry): boolean {
		return entry.action === 'LINEAGE' && /split from another hive/i.test((entry.title || '').trim())
	}

	const timelineRows = useMemo(() => {
		const rows: TimelineRow[] = []
		for (const entry of logs) {
			if (isRedundantSplitFromEntry(entry)) continue
			if (isSplitSourceEntry(entry)) continue
			const splitChild = isSplitChildEntry(entry)
			const mergeReceive = isMergeReceiveEntry(entry)
			rows.push({
				key: `entry-${entry.id}`,
				entry,
				splitChild,
				splitChildLinked: splitChild,
				mergeReceive,
			})
		}
		return rows
	}, [logs])

	const visibleTimelineRows = useMemo(
		() => timelineRows.slice(0, visibleCount),
		[timelineRows, visibleCount]
	)
	const hasMoreRows = visibleCount < timelineRows.length

	function getContinuousActionGroupKey(row: TimelineRow): string | null {
		if (row.splitChild || row.splitChildLinked || row.mergeReceive) return null
		const titleKey = canonicalizeTitle(row.entry.title || '').trim().toLowerCase()
		if (!titleKey) return null
		return `${row.entry.action}|${titleKey}`
	}

	const displayTimelineItems = useMemo(() => {
		const items: TimelineDisplayItem[] = []
		let idx = 0
		while (idx < visibleTimelineRows.length) {
			const current = visibleTimelineRows[idx]
			const groupKey = getContinuousActionGroupKey(current)
			if (!groupKey) {
				items.push({ kind: 'entry', row: current })
				idx += 1
				continue
			}

			const groupedRows: TimelineRow[] = [current]
			let nextIdx = idx + 1
			while (
				nextIdx < visibleTimelineRows.length &&
				getContinuousActionGroupKey(visibleTimelineRows[nextIdx]) === groupKey
			) {
				groupedRows.push(visibleTimelineRows[nextIdx])
				nextIdx += 1
			}

			if (groupedRows.length > 1) {
				items.push({
					kind: 'group',
					key: `group-${groupKey}-${groupedRows[0].entry.id}-${groupedRows[groupedRows.length - 1].entry.id}`,
					rows: groupedRows,
				})
			} else {
				items.push({ kind: 'entry', row: current })
			}
			idx = nextIdx
		}
		return items
	}, [visibleTimelineRows])

	function toggleGroup(groupKey: string) {
		setExpandedGroups((prev) => ({
			...prev,
			[groupKey]: !prev[groupKey],
		}))
	}

	async function onAddNote() {
		if (!draft.trim()) return
		await addManualHiveLogEntry(numericHiveId, draft)
		setDraft('')
	}

	function onStartEdit(entry: HiveLogEntry) {
		setEditingId(+entry.id)
		setEditTitle(entry.title || '')
		setEditDetails(entry.details || '')
	}

	async function onSaveEdit(id: number) {
		await updateHiveLogEntry(id, {
			title: editTitle,
			details: editDetails,
		})
		setEditingId(null)
	}

	function renderEntryCard(entry: HiveLogEntry, isEditing: boolean) {
		return (
			<>
				<div className={styles.titleRow}>
					<div
						className={styles.title}
						onDblClick={() => onStartEdit(entry)}
						title="Double-click to edit"
					>
						{getDisplayTitle(entry.title || '')}
					</div>
					{!isEditing && (
						<Button
							color="red"
							size="small"
							iconOnly
							className={styles.deleteButton}
							title="Delete entry"
							onClick={() => deleteHiveLogEntry(+entry.id)}
						>
							<TrashIcon size={16} />
						</Button>
					)}
				</div>

				{!isEditing && (
					<>
						<div className={styles.footerRow}>
							{entry.details && (
								<span
									className={styles.detailsInline}
									onDblClick={() => onStartEdit(entry)}
									title="Double-click to edit"
								>
									{entry.details}
								</span>
							)}
							<span className={styles.meta}>
								<DateTimeFormat datetime={entry.createdAt} />
							</span>
						</div>
						{Array.isArray(entry.relatedHives) && entry.relatedHives.length > 0 && (
							<div className={styles.relatedLinks}>
								{entry.relatedHives.map((related, index) => (
									<span key={related.id}>
										{index > 0 && ', '}
										<a href={`/apiaries/${apiaryId}/hives/${related.id}`}>
											{related.hiveNumber ? `Hive #${related.hiveNumber}` : `Hive ${related.id}`}
										</a>
									</span>
								))}
							</div>
						)}
					</>
				)}

				{isEditing && (
					<div className={styles.editBlock}>
						<input
							className={styles.editInput}
							value={editTitle}
							onInput={(event) => setEditTitle((event.target as HTMLInputElement).value)}
						/>
						<textarea
							className={styles.editTextarea}
							value={editDetails}
							onInput={(event) => setEditDetails((event.target as HTMLTextAreaElement).value)}
						/>
						<div className={styles.actions}>
							<Button color="green" onClick={() => onSaveEdit(+entry.id)}><T>Save</T></Button>
							<Button color="white" onClick={() => setEditingId(null)}><T>Cancel</T></Button>
						</div>
					</div>
				)}
			</>
		)
	}

	function getMarker(entry: HiveLogEntry): { className?: string; icon?: any } {
		const canonicalTitle = canonicalizeTitle(entry.title || '')
		const title = canonicalTitle.toLowerCase()
		const details = (entry.details || '').toLowerCase()

		if (entry.action === 'COLLAPSE' || title.includes('collapsed')) {
			return {
				className: styles.dotCollapsed,
				icon: <SkullIcon size={13} color="white" />,
			}
		}
		if (entry.action === 'TREATMENT') {
			return {
				className: styles.dotTreatment,
				icon: <LabVialIcon size={13} />,
			}
		}
		if (
			entry.action === 'QUEEN' &&
			(title.includes('new queen introduced') || title.includes('queen assigned from warehouse'))
		) {
			return {
				className: styles.dotQueen,
				icon: <QueenIcon size={13} color="#ffffff" />,
			}
		}
		if (
			entry.action === 'STRUCTURE_MOVE' &&
			(title.includes('section moved') || title.includes('section') || title.includes('swapped with section'))
		) {
			return {
				className: styles.dotMoveVertical,
				icon: (
					<span className={styles.iconPairVertical}>
						<UpIcon size={9} />
						<DownIcon size={9} />
					</span>
				),
			}
		}
		if (entry.action === 'STRUCTURE_MOVE' && (title.includes('frame rearranged') || title.includes('frame position'))) {
			return {
				className: styles.dotMoveHorizontal,
				icon: (
					<span className={styles.iconPairHorizontal}>
						<LeftChevron size={10} />
						<RightChevron size={10} />
					</span>
				),
			}
		}
		if (entry.action === 'STRUCTURE_ADD' && title.includes('section added')) {
			return {
				className: styles.dotGrowth,
				icon: <GrowthIcon size={13} />,
			}
		}
		if (entry.action === 'STRUCTURE_ADD' && title.includes('frame added')) {
			if (details.includes('foundation')) {
				return {
					className: styles.dotFrameAdd,
					icon: <FoundationIcon size={13} />,
				}
			}
			if (details.includes('void') || details.includes('empty frame')) {
				return {
					className: styles.dotFrameAdd,
					icon: <EmptyFrameIcon size={12} />,
				}
			}
			return {
				className: styles.dotFrameAdd,
				icon: <FramesIcon size={13} />,
			}
		}
		return {}
	}

	return (
		<div className={styles.logWrap}>
			<h3 className={styles.heading}>
				<T>Change history</T>
			</h3>
			<div className={styles.addRow}>
				<input
					className={styles.addInput}
					value={draft}
					onInput={(event) => setDraft((event.target as HTMLInputElement).value)}
					placeholder="Add a plain text log entry"
				/>
				<Button onClick={onAddNote} disabled={!draft.trim()}><T>Add entry</T></Button>
			</div>

			{logs.length === 0 && (
				<div className={styles.empty}>
					<T>No log entries yet</T>
				</div>
			)}

			{logs.length > 0 && (
				<div className={styles.timeline}>
					{displayTimelineItems.map((item) => {
						if (item.kind === 'entry') {
							const row = item.row
							const isEditing = editingId === +row.entry.id
							const marker = getMarker(row.entry)
							return (
								<div
									className={`${styles.entry} ${row.splitChild ? styles.entryBranchChild : ''} ${row.splitChildLinked ? styles.entryBranchLinked : ''} ${row.mergeReceive ? styles.entryMergeIn : ''}`}
									key={row.key}
								>
									{row.splitChild && (
										<>
											{row.splitChildLinked && (
												<>
													<span className={styles.splitLinkStem} />
													<svg
														className={styles.splitLinkCurve}
														viewBox="0 0 24 24"
														preserveAspectRatio="none"
														aria-hidden
													>
														<path d="M24 24 C18 18 10 6 0 0" />
													</svg>
												</>
											)}
											<span className={styles.branchSideDot} />
										</>
									)}
									{row.mergeReceive && (
										<>
											<svg
												className={styles.mergeCurve}
												viewBox="0 0 24 48"
												preserveAspectRatio="none"
												aria-hidden
											>
												<path d="M0 48 C10 38 18 12 24 0" />
											</svg>
											<span className={styles.mergeSideDot} />
										</>
									)}
									<div className={`${styles.dot} ${marker.className || ''}`}>
										{marker.icon && <span className={styles.dotIcon}>{marker.icon}</span>}
									</div>
									<div className={styles.card}>{renderEntryCard(row.entry, isEditing)}</div>
								</div>
							)
						}

						const newestRow = item.rows[0]
						const marker = getMarker(newestRow.entry)
						const isExpanded = Boolean(expandedGroups[item.key])
						return (
							<div
								className={`${styles.entry} ${newestRow.splitChild ? styles.entryBranchChild : ''} ${newestRow.splitChildLinked ? styles.entryBranchLinked : ''} ${newestRow.mergeReceive ? styles.entryMergeIn : ''}`}
								key={item.key}
							>
								<div className={`${styles.dot} ${marker.className || ''}`}>
									{marker.icon && <span className={styles.dotIcon}>{marker.icon}</span>}
								</div>
								<div className={styles.groupStack}>
									<div className={`${styles.card} ${styles.groupCard}`}>
										<div
											className={styles.groupSummary}
											onClick={() => toggleGroup(item.key)}
										>
											<span className={styles.groupTitle}>
												{getDisplayTitle(newestRow.entry.title || '')}
											</span>
											<span className={styles.groupCountBadge}>
												{item.rows.length} changes
											</span>
										</div>
										<div className={styles.groupDate}>
											<DateTimeFormat datetime={newestRow.entry.createdAt} />
										</div>
										{isExpanded && (
											<div className={styles.groupItems}>
												{item.rows.map((row) => {
													const isEditing = editingId === +row.entry.id
													return (
														<div className={styles.groupItem} key={row.key}>
															{renderEntryCard(row.entry, isEditing)}
														</div>
													)
												})}
											</div>
										)}
									</div>
								</div>
							</div>
						)
					})}
					{hasMoreRows && (
						<div className={styles.loadMoreWrap}>
							<Button onClick={() => setVisibleCount((prev) => prev + LOG_PAGE_SIZE)}>
								<T>Load more history</T>
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
