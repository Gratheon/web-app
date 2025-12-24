import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, gql } from '@/api'
import { useLiveQuery } from 'dexie-react-hooks'
import Button from '@/shared/button'
import Modal from '@/shared/modal'
import T, { useTranslation as t } from '@/shared/translate'
import ErrorMsg from '@/shared/messageError'
import FramePreview from '@/shared/framePreview'
import RefreshIcon from '@/icons/RefreshIcon'
import { getUser } from '@/models/user'
import { getBoxes } from '@/models/boxes'
import styles from './SplitHiveModal.module.less'

interface Frame {
	id: number
	position: number
	boxId: number
	leftId?: number
	rightId?: number
}

interface Box {
	id: number
	position: number
	type: string
}

interface SplitHiveModalProps {
	isOpen: boolean
	onClose: () => void
	hiveId: string
	apiaryId: string
	frames: Frame[]
}

const RANDOM_HIVE_NAME_QUERY = gql`
	query RandomHiveName($language: String) {
		randomHiveName(language: $language)
	}
`

export default function SplitHiveModal({
	isOpen,
	onClose,
	hiveId,
	apiaryId,
	frames,
}: SplitHiveModalProps) {
	const [selectedFrameIds, setSelectedFrameIds] = useState<Set<number>>(new Set())
	const [queenAction, setQueenAction] = useState<'new_queen' | 'take_old_queen' | 'no_queen'>('new_queen')
	const [newHiveName, setNewHiveName] = useState('')
	const [error, setError] = useState<Error | null>(null)
	const [lang, setLang] = useState('en')
	const navigate = useNavigate()

	const user = useLiveQuery(() => getUser(), [], null)
	const boxes = useLiveQuery(() => getBoxes({ hiveId: +hiveId }), [hiveId], [])

	useEffect(() => {
		let currentLang = 'en'
		if (user && user?.lang) {
			currentLang = user.lang
		} else if (user === null) {
			const browserLang = navigator.language.substring(0, 2)
			if (SUPPORTED_LANGUAGES.includes(browserLang)) {
				lang = browserLang
			}
		}
		setLang(currentLang)
	}, [user])

	const { data: randomNameData, loading: randomNameLoading, reexecuteQuery: reexecuteRandomNameQuery } = useQuery(
		RANDOM_HIVE_NAME_QUERY,
		{ variables: { language: lang } }
	)

	useEffect(() => {
		if (randomNameData?.randomHiveName && !randomNameLoading) {
			setNewHiveName(randomNameData.randomHiveName)
		}
	}, [randomNameData, randomNameLoading])

	const handleRefreshName = useCallback(() => {
		reexecuteRandomNameQuery({ requestPolicy: 'network-only' })
	}, [reexecuteRandomNameQuery])

	const handleQueenActionChange = useCallback((value: string) => {
		if (value === 'new_queen' || value === 'take_old_queen' || value === 'no_queen') {
			setQueenAction(value as 'new_queen' | 'take_old_queen' | 'no_queen')
		}
	}, [])

	const [splitHiveMutation, { loading }] = useMutation(`
		mutation splitHive($sourceHiveId: ID!, $queenName: String, $queenAction: String!, $frameIds: [ID!]!) {
			splitHive(sourceHiveId: $sourceHiveId, queenName: $queenName, queenAction: $queenAction, frameIds: $frameIds) {
				id
				family {
					id
					name
				}
			}
		}
	`)

	const lastToggleRef = useRef<{ frameId: number; timestamp: number } | null>(null)

	const toggleFrameSelection = useCallback((frameId: number) => {
		console.log(`[SplitHiveModal] toggleFrameSelection called for frame ${frameId}`)

		const now = Date.now()
		if (lastToggleRef.current &&
		    lastToggleRef.current.frameId === frameId &&
		    now - lastToggleRef.current.timestamp < 100) {
			console.log(`[SplitHiveModal] Ignoring rapid repeated click on frame ${frameId} (within 100ms)`)
			return
		}

		lastToggleRef.current = { frameId, timestamp: now }
		const startTime = performance.now()

		flushSync(() => {
			setSelectedFrameIds(prev => {
				const newSelection = new Set(prev)
				if (newSelection.has(frameId)) {
					newSelection.delete(frameId)
				} else {
					if (newSelection.size >= 10) {
						setError(new Error('You can select maximum 10 frames'))
						return prev
					}
					newSelection.add(frameId)
				}
				setError(null)

				const endTime = performance.now()
				console.log(`[SplitHiveModal] toggleFrameSelection completed in ${endTime - startTime}ms`)
				return newSelection
			})
		})
	}, [])

	const onClickHandlers = useMemo(() => {
		const handlers = new Map<number, () => void>()
		frames.forEach(frame => {
			handlers.set(frame.id, () => toggleFrameSelection(frame.id))
		})
		return handlers
	}, [frames, toggleFrameSelection])

	const handleSplit = async () => {
		if (selectedFrameIds.size === 0) {
			setError(new Error('Please select at least one frame'))
			return
		}

		if (queenAction === 'new_queen' && !newHiveName.trim()) {
			setError(new Error('Please enter a queen name or generate one'))
			return
		}

		try {
			const { data, error: mutationError } = await splitHiveMutation({
				sourceHiveId: hiveId,
				queenName: queenAction === 'new_queen' ? newHiveName : null,
				queenAction: queenAction,
				frameIds: Array.from(selectedFrameIds).map(String),
			})

			if (mutationError) {
				setError(mutationError)
				return
			}

			if (data?.splitHive) {
				let message = `New hive created with ${selectedFrameIds.size} frames`
				if (queenAction === 'new_queen') {
					const queenName = data.splitHive.family?.name || 'Unknown'
					message = `New hive with queen "${queenName}" created with ${selectedFrameIds.size} frames`
				} else if (queenAction === 'take_old_queen') {
					message = `New hive created with ${selectedFrameIds.size} frames and the old queen`
				} else if (queenAction === 'no_queen') {
					message = `New hive created with ${selectedFrameIds.size} frames (queenless)`
				}

				navigate(`/apiaries/${apiaryId}/hives/${data.splitHive.id}`, {
					state: {
						title: 'Hive split successfully',
						message: message,
					},
				})
			}
		} catch (err) {
			setError(err as Error)
		}
	}

	const handleClose = () => {
		setSelectedFrameIds(new Set())
		setQueenAction('new_queen')
		setNewHiveName('')
		setError(null)
		onClose()
	}

	if (!isOpen) return null

	return (
		<Modal onClose={handleClose} title={<T>Split Colony</T>} className={styles.wideModal}>
			<div className={styles.content}>
				<p>
					<T>Select up to 10 frames to move to a new hive</T>
				</p>

				{error && <ErrorMsg error={error} />}

				<div className={styles.formGroup}>
					<label>
						<T>Queen Management</T>
					</label>
					<div className={styles.radioGroup}>
						<label className={styles.radioLabel}>
							<input
								type="radio"
								name="queenAction"
								value="new_queen"
								checked={queenAction === 'new_queen'}
								onChange={(e) => handleQueenActionChange((e.target as HTMLInputElement).value)}
							/>
							<T>Install new queen</T>
						</label>
						<label className={styles.radioLabel}>
							<input
								type="radio"
								name="queenAction"
								value="take_old_queen"
								checked={queenAction === 'take_old_queen'}
								onChange={(e) => handleQueenActionChange((e.target as HTMLInputElement).value)}
							/>
							<T>Take old queen (source hive becomes queenless)</T>
						</label>
						<label className={styles.radioLabel}>
							<input
								type="radio"
								name="queenAction"
								value="no_queen"
								checked={queenAction === 'no_queen'}
								onChange={(e) => handleQueenActionChange((e.target as HTMLInputElement).value)}
							/>
							<T>No queen (queenless split)</T>
						</label>
					</div>
				</div>

				{queenAction === 'new_queen' && (
					<div className={styles.formGroup}>
						<label htmlFor="newHiveName">
							<T>Queen Name</T>
						</label>
						<div className={styles.nameInputWrapper}>
							<input
								id="newHiveName"
								type="text"
								value={newHiveName}
								onInput={(e) => setNewHiveName((e.target as HTMLInputElement).value)}
								placeholder={t('Enter name for queen')}
								className={styles.input}
							/>
							<Button
								onClick={handleRefreshName}
								loading={randomNameLoading}
								title="Generate new name"
								className={styles.refreshButton}
							>
								<RefreshIcon width={16} height={16} />
							</Button>
						</div>
					</div>
				)}

				<div className={styles.frameSelection}>
					<h3>
						<T>Select Frames</T> ({selectedFrameIds.size}/10)
					</h3>
					<div className={styles.boxesContainer}>
						{boxes
							.sort((a, b) => (b.position || 0) - (a.position || 0))
							.map((box) => {
								const boxFrames = frames
									.filter((f) => f.boxId === box.id)
									.sort((a, b) => a.position - b.position)

								if (boxFrames.length === 0) return null

								return (
									<div key={box.id} className={styles.boxGroup}>
										<div className={styles.boxHeader}>
											<T>Box</T> {box.position + 1} ({box.type})
										</div>
										<div className={styles.frameList}>
											{boxFrames.map((frame) => (
												<FramePreview
													key={frame.id}
													frameId={frame.id}
													position={frame.position}
													leftId={frame.leftId}
													rightId={frame.rightId}
													isSelected={selectedFrameIds.has(frame.id)}
													onClick={onClickHandlers.get(frame.id)}
													showCheckbox={true}
												/>
											))}
										</div>
									</div>
								)
							})}
					</div>
				</div>

				<div className={styles.actions}>
					<Button onClick={handleClose} disabled={loading}>
						<T>Cancel</T>
					</Button>
					<Button
						color="primary"
						onClick={handleSplit}
						loading={loading}
						disabled={selectedFrameIds.size === 0 || (queenAction === 'new_queen' && !newHiveName.trim())}
					>
						<T>Split Colony</T>
					</Button>
				</div>
			</div>
		</Modal>
	)
}

