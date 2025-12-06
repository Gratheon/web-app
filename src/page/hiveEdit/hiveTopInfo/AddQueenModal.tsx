import { h } from 'preact'
import { useState } from 'preact/hooks'
import { useMutation } from '@/api'
import T from '@/shared/translate'
import Modal from '@/shared/modal'
import Input from '@/shared/input'
import Button from '@/shared/button'
import MessageError from '@/shared/messageError'
import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor'
import { updateFamily, getFamilyByHive } from '@/models/family'
import { getHive } from '@/models/hive'
import styles from './AddQueenModal.module.less'
import inputStyles from '@/shared/input/styles.module.less'

interface AddQueenModalProps {
	hiveId: number
	onClose: () => void
	onSuccess: () => void
}

export default function AddQueenModal({ hiveId, onClose, onSuccess }: AddQueenModalProps) {
	const currentYear = new Date().getFullYear().toString()
	const [race, setRace] = useState('')
	const [year, setYear] = useState(currentYear)
	const [error, setError] = useState<string | null>(null)

	const [mutateHive, { error: mutationError, loading }] = useMutation(`
		mutation updateHive($hive: HiveUpdateInput!) {
			updateHive(hive: $hive) {
				id
				family {
					id
					race
					added
				}
			}
		}
	`)

	const handleSubmit = async () => {
		setError(null)

		if (!race.trim()) {
			setError('Please provide the queen race.')
			return
		}

		if (!year || year.length !== 4) {
			setError('Please provide a valid year (4 digits).')
			return
		}

		try {
			const hive = await getHive(hiveId)

			const result = await mutateHive({
				hive: {
					id: hiveId,
					name: hive.name,
					notes: hive.notes,
					family: {
						id: null,
						race: race.trim(),
						added: year,
					},
				},
			})

			if (result.data?.updateHive?.family) {
				const family = {
					id: +result.data.updateHive.family.id,
					hiveId: hiveId,
					race: result.data.updateHive.family.race,
					added: result.data.updateHive.family.added,
				}
				await updateFamily(family)
			}

			onSuccess()
		} catch (err) {
			setError(err.message || 'Failed to add queen')
		}
	}

	return (
		<Modal title={<T>Add Queen</T>} onClose={onClose}>
			<div className={styles.modalContent}>
				<MessageError error={error || mutationError} />

				<label className={inputStyles.label}><T>Race</T></label>
				<input
					className={inputStyles.input}
					type="text"
					value={race}
					onChange={(e: h.JSX.TargetedEvent<HTMLInputElement, Event>) => setRace((e.target as HTMLInputElement).value)}
					autoFocus
				/>

				<div className={styles.yearInputWrapper}>
					<div>
						<label className={inputStyles.label}><T>Year</T></label>
						<input
							className={inputStyles.input}
							type="text"
							value={year}
							maxLength={4}
							onChange={(e: h.JSX.TargetedEvent<HTMLInputElement, Event>) => setYear((e.target as HTMLInputElement).value)}
						/>
					</div>
					<div className={styles.colorPreview}>
						<QueenColor year={year} useRelative={false} />
					</div>
				</div>

				<div className={styles.buttonContainer}>
					<Button onClick={handleSubmit} loading={loading} color="green">
						<T>Add Queen</T>
					</Button>
				</div>
			</div>
		</Modal>
	)
}

