import { h } from 'preact'
import { useState } from 'preact/hooks'
import T from '@/shared/translate'
import Button from '@/shared/button'
import QueenIcon from '@/icons/queenIcon'
import TrashIcon from '@/icons/trashIcon'
import PlusIcon from '@/icons/plusIcon'
import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor'
import { getQueenColorFromYear } from '@/page/hiveEdit/hiveTopInfo/queenColor/utils'
import { Family } from '@/models/family'
import styles from './QueenSlot.module.less'

//@ts-ignore
import GithubPicker from 'react-color/es/Github'

const colors = [
	'#fefee3',
	'#ffba08',
	'#f94144',
	'#38b000',
	'#0466c8',
	'#4D4D4D',
	'#999999',
	'#FFFFFF',
	'#F44E3B',
	'#FE9200',
	'#FCDC00',
	'#DBDF00',
	'#A4DD00',
	'#68CCCA',
	'#73D8FF',
	'#AEA1FF',
	'#FDA1FF',
	'#333333',
	'#808080',
	'#cccccc',
	'#D33115',
	'#E27300',
	'#FCC400',
	'#B0BC00',
	'#68BC00',
	'#16A5A5',
	'#009CE0',
	'#7B64FF',
	'#FA28FF',
	'#000000',
	'#666666',
	'#B3B3B3',
	'#9F0500',
	'#C45100',
	'#FB9E00',
	'#808900',
	'#194D33',
	'#0C797D',
	'#0062B1',
	'#653294',
	'#AB149E',
]

interface QueenSlotProps {
	families: Family[]
	editable: boolean
	onAddQueen: () => void
	onRemoveQueen: (familyId: number) => void
	onUpdateQueen?: (familyId: number, name: string, race: string, year: string, color?: string) => void
	onDragStart?: (familyId: number) => void
	onDragEnd?: () => void
	showAddButton?: boolean
}

export default function QueenSlot({
	families,
	editable,
	onAddQueen,
	onRemoveQueen,
	onUpdateQueen,
	onDragStart,
	onDragEnd,
	showAddButton = false
}: QueenSlotProps) {
	const [draggingId, setDraggingId] = useState<number | null>(null)
	const [editingId, setEditingId] = useState<number | null>(null)
	const [editName, setEditName] = useState('')
	const [editRace, setEditRace] = useState('')
	const [editYear, setEditYear] = useState('')
	const [editColor, setEditColor] = useState<string | null>(null)
	const [showColorPicker, setShowColorPicker] = useState(false)

	const handleDragStart = (e: h.JSX.TargetedDragEvent<HTMLDivElement>, familyId: number) => {
		setDraggingId(familyId)
		e.dataTransfer.effectAllowed = 'move'
		e.dataTransfer.setData('familyId', familyId.toString())
		if (onDragStart) onDragStart(familyId)
	}

	const handleDragEnd = () => {
		setDraggingId(null)
		if (onDragEnd) onDragEnd()
	}

	if (!families || families.length === 0) {
		return (
			<div
				className={`${styles.queenSlot} ${styles.empty} ${editable ? styles.editable : ''}`}
				onClick={editable ? onAddQueen : undefined}
			>
				<div className={styles.emptyText}>
					{editable ? (
						<>
							<PlusIcon size={20} />
							<T>Add Queen</T>
						</>
					) : (
						<T>No queen in this hive</T>
					)}
				</div>
			</div>
		)
	}

	return (
		<div>
			{families.length > 1 && editable && (
				<div className={styles.multipleWarning}>
					<T>Multiple Queens</T> ({families.length})
				</div>
			)}

			<div className={styles.queensContainer}>
				<div className={styles.queensList}>
					{families.map((family) => (
				<div
					key={family.id}
					className={`${styles.queenSlot} ${styles.filled} ${editable ? styles.editable : ''} ${
						draggingId === family.id ? styles.dragging : ''
					} ${families.length > 1 ? styles.multiple : ''}`}
					draggable={editable}
					onDragStart={(e) => editable ? handleDragStart(e, family.id) : undefined}
					onDragEnd={editable ? handleDragEnd : undefined}
				>
					<div className={styles.queenInfo}>
						<div className={styles.queenIcon}>
							<QueenIcon size={28} />
						</div>
						<div className={styles.queenDetails}>
							{editable && editingId === family.id ? (
								<div className={styles.colorPickerWrapper}>
									<div
										className={styles.colorPreview}
										onClick={(e) => {
											e.stopPropagation()
											setShowColorPicker(!showColorPicker)
										}}
									>
										<QueenColor year={editYear} color={editColor} />
									</div>
									{showColorPicker && (
										<>
											<div
												className={styles.colorPickerOverlay}
												onClick={() => setShowColorPicker(false)}
											/>
											<div className={styles.colorPickerPopup}>
												<GithubPicker
													width={212}
													colors={colors}
													onChangeComplete={(c: any) => {
														setEditColor(c.hex)
														setShowColorPicker(false)
													}}
													color={editColor || getQueenColorFromYear(editYear)}
												/>
											</div>
										</>
									)}
								</div>
							) : (
								<QueenColor
									year={family.added}
									color={family.color}
								/>
							)}
							{editable && editingId === family.id ? (
								<>
                  <input
                      type="text"
                      className={styles.yearInput}
                      value={editYear}
                      onChange={(e: any) => {
                        setEditYear(e.target.value)
                        setEditColor(null)
                      }}
                      onBlur={() => {
                        if (onUpdateQueen) {
                          onUpdateQueen(family.id, editName, editRace, editYear, editColor)
                        }
                        setEditingId(null)
                        setShowColorPicker(false)
                      }}
                      onKeyDown={(e: any) => {
                        if (e.key === 'Enter') {
                          if (onUpdateQueen) {
                            onUpdateQueen(family.id, editName, editRace, editYear, editColor)
                          }
                          setEditingId(null)
                          setShowColorPicker(false)
                        }
                      }}
                      placeholder="Year"
                      maxLength={4}
                  />
									<input
										type="text"
										className={styles.nameInput}
										value={editName}
										onChange={(e: any) => setEditName(e.target.value)}
										onBlur={() => {
											if (onUpdateQueen) {
												onUpdateQueen(family.id, editName, editRace, editYear, editColor)
											}
											setEditingId(null)
											setShowColorPicker(false)
										}}
										onKeyDown={(e: any) => {
											if (e.key === 'Enter') {
												if (onUpdateQueen) {
													onUpdateQueen(family.id, editName, editRace, editYear, editColor)
												}
												setEditingId(null)
												setShowColorPicker(false)
											}
										}}
										placeholder="Queen Name"
										autoFocus
									/>
									<input
										type="text"
										className={styles.raceInput}
										value={editRace}
										onChange={(e: any) => setEditRace(e.target.value)}
										onBlur={() => {
											if (onUpdateQueen) {
												onUpdateQueen(family.id, editName, editRace, editYear, editColor)
											}
											setEditingId(null)
											setShowColorPicker(false)
										}}
										onKeyDown={(e: any) => {
											if (e.key === 'Enter') {
												if (onUpdateQueen) {
													onUpdateQueen(family.id, editName, editRace, editYear, editColor)
												}
												setEditingId(null)
												setShowColorPicker(false)
											}
										}}
										placeholder="Race"
									/>

								</>
							) : (
								<>
									<span
										className={styles.queenName}
										onClick={() => {
											if (editable && onUpdateQueen) {
												setEditingId(family.id)
												setEditName(family.name || '')
												setEditRace(family.race || '')
												setEditYear(family.added || '')
												setEditColor(family.color || null)
												setShowColorPicker(false)
											}
										}}
										style={{ cursor: editable ? 'pointer' : 'default' }}
									>
										{family.name || <T>Unnamed Queen</T>}
									</span>
                  <span
                      className={styles.queenYear}
                      onClick={() => {
                        if (editable && onUpdateQueen) {
                          setEditingId(family.id)
                          setEditName(family.name || '')
                          setEditRace(family.race || '')
                          setEditYear(family.added || '')
                          setEditColor(family.color || null)
                          setShowColorPicker(false)
                        }
                      }}
                      style={{ cursor: editable ? 'pointer' : 'default' }}
                  >
										{family.added || <T>Unknown Year</T>}
                    {family.age && <> ({family.age} <T>years</T>)</>}
									</span>

									<span
										className={styles.queenRace}
										onClick={() => {
											if (editable && onUpdateQueen) {
												setEditingId(family.id)
												setEditName(family.name || '')
												setEditRace(family.race || '')
												setEditYear(family.added || '')
												setEditColor(family.color || null)
												setShowColorPicker(false)
											}
										}}
										style={{ cursor: editable ? 'pointer' : 'default' }}
									>
										{family.race || <T>Unknown Race</T>}
									</span>

								</>
							)}
						</div>
					</div>

					{editable && (
						<div className={styles.queenActions}>
							<Button
								className={`${styles.actionButton} ${styles.remove}`}
								onClick={(e) => {
									e.stopPropagation()
									if (confirm('Are you sure you want to remove this queen from the hive?')) {
										onRemoveQueen(family.id)
									}
								}}
								title="Remove queen"
								iconOnly={true}
							>
								<TrashIcon size={20} />
							</Button>
						</div>
					)}
					</div>
				))}
				</div>

				{showAddButton && (
					<Button
						type="button"
						className={styles.addAnotherButton}
						onClick={(e) => {
							e.preventDefault()
							e.stopPropagation()
							onAddQueen()
						}}
						title="Add another queen"
					>
						<PlusIcon size={14} />
						<span>Add</span>
					</Button>
				)}
			</div>
		</div>
	)
}

