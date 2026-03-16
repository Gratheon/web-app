import { useEffect, useState } from 'react'
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
					{logs.map((entry) => {
						const isEditing = editingId === +entry.id
						return (
							<div className={styles.entry} key={entry.id}>
								<div className={styles.dot} />
								<div className={styles.card}>
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
																{related.hiveNumber
																	? `Hive #${related.hiveNumber}`
																	: `Hive ${related.id}`}
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
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
