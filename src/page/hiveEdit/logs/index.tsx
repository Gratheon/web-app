import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import Button from '@/shared/button'
import DateTimeFormat from '@/shared/dateTimeFormat'
import T from '@/shared/translate'
import TrashIcon from '@/icons/trashIcon'
import {
	addManualHiveLogEntry,
	deleteHiveLogEntry,
	formatHiveLogAction,
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

export default function HiveLogs({ hiveId, apiaryId }: { hiveId: string; apiaryId: string }) {
	const numericHiveId = +hiveId
	const logs = useLiveQuery(() => listHiveLogs(numericHiveId), [numericHiveId], null)
	const [draft, setDraft] = useState('')
	const [editingId, setEditingId] = useState<number | null>(null)
	const [editTitle, setEditTitle] = useState('')
	const [editDetails, setEditDetails] = useState('')

	useEffect(() => {
		syncHiveLogsFromBackend(numericHiveId).catch((e) =>
			console.error('Failed to sync hive logs in view', e)
		)
	}, [numericHiveId])

	if (logs === null) {
		return null
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
				<div className={styles.headerRow}>
					<div className={styles.meta}>
						{formatHiveLogAction(entry.action)} • <DateTimeFormat datetime={entry.createdAt} />
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
						<div
							className={styles.title}
							onDblClick={() => onStartEdit(entry)}
							title="Double-click to edit"
						>
							{entry.title}
						</div>
						{entry.details && (
							<div
								className={styles.details}
								onDblClick={() => onStartEdit(entry)}
								title="Double-click to edit"
							>
								{entry.details}
							</div>
						)}
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
					{timelineRows.map((row) => {
						const isEditing = editingId === +row.entry.id
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
								<div className={styles.dot} />
								<div className={styles.card}>{renderEntryCard(row.entry, isEditing)}</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
