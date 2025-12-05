import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@/api'
import Button from '@/shared/button'
import Modal from '@/shared/modal'
import T from '@/shared/translate'
import ErrorMsg from '@/shared/messageError'
import styles from './SplitHiveModal.module.less'

interface Frame {
	id: number
	position: number
}

interface SplitHiveModalProps {
	isOpen: boolean
	onClose: () => void
	hiveId: string
	apiaryId: string
	frames: Frame[]
}

export default function SplitHiveModal({
	isOpen,
	onClose,
	hiveId,
	apiaryId,
	frames,
}: SplitHiveModalProps) {
	const [selectedFrameIds, setSelectedFrameIds] = useState<Set<number>>(new Set())
	const [newHiveName, setNewHiveName] = useState('')
	const [error, setError] = useState<Error | null>(null)
	const navigate = useNavigate()

	const [splitHiveMutation, { loading }] = useMutation(`
		mutation splitHive($sourceHiveId: ID!, $name: String!, $frameIds: [ID!]!) {
			splitHive(sourceHiveId: $sourceHiveId, name: $name, frameIds: $frameIds) {
				id
				name
			}
		}
	`)

	const toggleFrameSelection = (frameId: number) => {
		const newSelection = new Set(selectedFrameIds)
		if (newSelection.has(frameId)) {
			newSelection.delete(frameId)
		} else {
			if (newSelection.size >= 10) {
				setError(new Error('You can select maximum 10 frames'))
				return
			}
			newSelection.add(frameId)
		}
		setSelectedFrameIds(newSelection)
		setError(null)
	}

	const handleSplit = async () => {
		if (!newHiveName.trim()) {
			setError(new Error('Please enter a name for the new hive'))
			return
		}

		if (selectedFrameIds.size === 0) {
			setError(new Error('Please select at least one frame'))
			return
		}

		try {
			const { data, error: mutationError } = await splitHiveMutation({
				sourceHiveId: hiveId,
				name: newHiveName,
				frameIds: Array.from(selectedFrameIds).map(String),
			})

			if (mutationError) {
				setError(mutationError)
				return
			}

			if (data?.splitHive) {
				navigate(`/apiaries/${apiaryId}/hives/${data.splitHive.id}`, {
					state: {
						title: 'Hive split successfully',
						message: `New hive "${data.splitHive.name}" created with ${selectedFrameIds.size} frames`,
					},
				})
			}
		} catch (err) {
			setError(err as Error)
		}
	}

	const handleClose = () => {
		setSelectedFrameIds(new Set())
		setNewHiveName('')
		setError(null)
		onClose()
	}

	if (!isOpen) return null

	return (
		<Modal onClose={handleClose} title={<T>Split Hive</T>}>
			<div className={styles.content}>
				<p>
					<T>Select up to 10 frames to move to a new hive</T>
				</p>

				{error && <ErrorMsg error={error} />}

				<div className={styles.formGroup}>
					<label htmlFor="newHiveName">
						<T>New Hive Name</T>
					</label>
					<input
						id="newHiveName"
						type="text"
						value={newHiveName}
						onInput={(e) => setNewHiveName((e.target as HTMLInputElement).value)}
						placeholder="Enter name for new hive"
						className={styles.input}
					/>
				</div>

				<div className={styles.frameSelection}>
					<h3>
						<T>Select Frames</T> ({selectedFrameIds.size}/10)
					</h3>
					<div className={styles.frameList}>
						{frames.map((frame) => (
							<div
								key={frame.id}
								className={`${styles.frameItem} ${
									selectedFrameIds.has(frame.id) ? styles.selected : ''
								}`}
								onClick={() => toggleFrameSelection(frame.id)}
							>
								<input
									type="checkbox"
									checked={selectedFrameIds.has(frame.id)}
									onChange={() => toggleFrameSelection(frame.id)}
								/>
								<span>
									<T>Frame</T> {frame.position + 1}
								</span>
							</div>
						))}
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
						disabled={selectedFrameIds.size === 0 || !newHiveName.trim()}
					>
						<T>Split Hive</T>
					</Button>
				</div>
			</div>
		</Modal>
	)
}

