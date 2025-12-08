import { useState, useEffect } from 'react'
import { useMutation, useQuery, gql } from '@/api'
import { useLiveQuery } from 'dexie-react-hooks'
import Button from '@/shared/button'
import Modal from '@/shared/modal'
import T from '@/shared/translate'
import ErrorMsg from '@/shared/messageError'
import HiveIcon from '@/shared/hive'
import BeeCounter from '@/shared/beeCounter'
import { getHive } from '@/models/hive'
import { getBoxes } from '@/models/boxes'
import { getFamilyByHive } from '@/models/family'
import styles from './JoinColonyModal.module.less'

interface JoinColonyModalProps {
	isOpen: boolean
	onClose: () => void
	hiveId: string
	apiaryId: string
}

const JOIN_HIVES_MUTATION = gql`
	mutation joinHives($sourceHiveId: ID!, $targetHiveId: ID!, $mergeType: String!) {
		joinHives(sourceHiveId: $sourceHiveId, targetHiveId: $targetHiveId, mergeType: $mergeType) {
			id
		}
	}
`

const HIVES_BY_APIARY_QUERY = gql`
	query getApiaryHives($id: ID!) {
		apiary(id: $id) {
			id
			hives {
				id
				hiveNumber
				boxCount
				family {
					id
					race
					added
					color
				}
			}
		}
	}
`

export default function JoinColonyModal({
	isOpen,
	onClose,
	hiveId,
	apiaryId,
}: JoinColonyModalProps) {
	const [selectedTargetHiveId, setSelectedTargetHiveId] = useState<string | null>(null)
	const [mergeType, setMergeType] = useState<string>('both_queens')
	const [error, setError] = useState<Error | null>(null)

	const currentHive = useLiveQuery(() => getHive(+hiveId), [hiveId], null)
	const currentBoxes = useLiveQuery(() => getBoxes({ hiveId: +hiveId }), [hiveId], [])
	const currentFamily = useLiveQuery(() => getFamilyByHive(+hiveId), [hiveId], null)

	const { data: apiaryData } = useQuery(HIVES_BY_APIARY_QUERY, {
		variables: { id: apiaryId },
	})

	const [joinHivesMutation, { loading }] = useMutation(JOIN_HIVES_MUTATION)

	const otherHives =
		apiaryData?.apiary?.hives?.filter((h: any) => h.id !== hiveId && h.boxCount > 0) || []

	const selectedTargetHive = otherHives.find((h: any) => h.id === selectedTargetHiveId)

	const handleJoin = async () => {
		if (!selectedTargetHiveId) {
			setError(new Error('Please select a target hive'))
			return
		}

		try {
			const { data, error: mutationError } = await joinHivesMutation({
				sourceHiveId: hiveId,
				targetHiveId: selectedTargetHiveId,
				mergeType: mergeType,
			})

			if (mutationError) {
				setError(mutationError)
				return
			}

			if (data?.joinHives) {
				window.location.href = `/apiaries/${apiaryId}/hives/${data.joinHives.id}`
			}
		} catch (err) {
			setError(err as Error)
		}
	}

	const handleClose = () => {
		setSelectedTargetHiveId(null)
		setMergeType('both_queens')
		setError(null)
		onClose()
	}

	const getMergeTypeIcon = () => {
		switch (mergeType) {
			case 'both_queens':
				return '+'
			case 'source_queen_kept':
				return '←'
			case 'target_queen_kept':
				return '→'
			default:
				return '+'
		}
	}

	const getMergeTypeDescription = () => {
		switch (mergeType) {
			case 'both_queens':
				return <T>Both queens are kept alive. The strongest one will win.</T>
			case 'source_queen_kept':
				return <T>Source queen is kept alive. Target queen is removed.</T>
			case 'target_queen_kept':
				return <T>Target queen is kept alive. Source queen is removed.</T>
			default:
				return ''
		}
	}

	const cycleMergeType = () => {
		const types = ['both_queens', 'target_queen_kept', 'source_queen_kept']
		const currentIndex = types.indexOf(mergeType)
		const nextIndex = (currentIndex + 1) % types.length
		setMergeType(types[nextIndex])
	}

	if (!isOpen) return null

	return (
		<Modal onClose={handleClose} title={<T>Join Colonies</T>} className={styles.modal}>
			<div className={styles.content}>
				<p>
					<T>Select a target hive to merge this colony into</T>
				</p>

				{error && <ErrorMsg error={error} />}

				<div className={styles.hivesContainer}>
					<div className={styles.hivePanel}>
						<h3>
							<T>Source Hive</T>
						</h3>
						{currentHive && (
							<div className={styles.hiveCard}>
								<HiveIcon boxes={currentBoxes} />
								<div className={styles.hiveInfo}>
									<h4>{currentHive.name}</h4>
									<BeeCounter count={currentHive.beeCount} />
									{currentFamily && (
										<div className={styles.familyInfo}>
											<div>
												<T>Race</T>: {currentFamily.race}
											</div>
											<div>
												<T>Year</T>: {currentFamily.added}
											</div>
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					<div className={styles.mergeTypeContainer}>
						<button className={styles.mergeTypeButton} onClick={cycleMergeType}>
							{getMergeTypeIcon()}
						</button>
						<div className={styles.mergeTypeDescription}>{getMergeTypeDescription()}</div>
					</div>

					<div className={styles.hivePanel}>
						<h3>
							<T>Target Hive</T>
						</h3>
						{selectedTargetHive ? (
							<div className={styles.hiveCard}>
								<div className={styles.hiveInfo}>
									<h4>{selectedTargetHive.hiveNumber ? `#${selectedTargetHive.hiveNumber}` : `Hive ${selectedTargetHive.id}`}</h4>
									{selectedTargetHive.family && (
										<div className={styles.familyInfo}>
											<div>
												<T>Race</T>: {selectedTargetHive.family.race}
											</div>
											<div>
												<T>Year</T>: {selectedTargetHive.family.added}
											</div>
										</div>
									)}
								</div>
							</div>
						) : (
							<div className={styles.selectPrompt}>
								<T>Select a hive below</T>
							</div>
						)}
					</div>
				</div>

				<div className={styles.hiveList}>
					<h3>
						<T>Available Hives</T>
					</h3>
					{otherHives.length === 0 ? (
						<p>
							<T>No other hives available in this apiary</T>
						</p>
					) : (
						<div className={styles.hiveOptions}>
							{otherHives.map((hive: any) => (
								<div
									key={hive.id}
									className={`${styles.hiveOption} ${
										selectedTargetHiveId === hive.id ? styles.selected : ''
									}`}
									onClick={() => setSelectedTargetHiveId(hive.id)}
								>
									<div className={styles.hiveName}>
										{hive.hiveNumber && `#${hive.hiveNumber} `}
										{hive.family?.name || <T>Unnamed Queen</T>}
									</div>
									{hive.family && (
										<div className={styles.hiveDetails}>
											{hive.family.race} ({hive.family.added})
										</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>

				<div className={styles.buttonContainer}>
					<Button onClick={handleClose}>
						<T>Cancel</T>
					</Button>
					<Button onClick={handleJoin} loading={loading} disabled={!selectedTargetHiveId}>
						<T>Join Colonies</T>
					</Button>
				</div>
			</div>
		</Modal>
	)
}

