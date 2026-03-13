import { h } from 'preact'
import { useState, useEffect, useCallback } from 'preact/hooks'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMutation, useQuery, gql } from '@/api'
import T from '@/shared/translate'
import Modal from '@/shared/modal'
import Button from '@/shared/button'
import MessageError from '@/shared/messageError'
import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor'
import QueenColorPicker from '@/shared/queenColorPicker'
import { updateFamily } from '@/models/family'
import { getUser } from '@/models/user'
import { SUPPORTED_LANGUAGES } from '@/config/languages'
import RefreshIcon from '@/icons/RefreshIcon'
import styles from './AddQueenModal.module.less'
import inputStyles from '@/shared/input/styles.module.less'

const RANDOM_QUEEN_NAME_QUERY = gql`
	query RandomHiveName($language: String) {
		randomHiveName(language: $language)
	}
`

const WAREHOUSE_QUEENS_QUERY = gql`
	query WarehouseQueensForAdd {
		warehouseQueens {
			id
			name
			race
			added
			color
		}
	}
`

type ModalMode = 'create' | 'warehouse'

type WarehouseQueen = {
	id: string
	name?: string | null
	race?: string | null
	added?: string | null
	color?: string | null
}

interface AddQueenModalProps {
	hiveId: number
	mode?: ModalMode
	allowModeSwitch?: boolean
	onClose: () => void
	onSuccess: () => void
}

export default function AddQueenModal({
	hiveId,
	mode: initialMode = 'create',
	allowModeSwitch = true,
	onClose,
	onSuccess
}: AddQueenModalProps) {
	const currentYear = new Date().getFullYear().toString()
	const [mode, setMode] = useState<ModalMode>(initialMode)
	const [name, setName] = useState('')
	const [race, setRace] = useState('')
	const [year, setYear] = useState(currentYear)
	const [customColor, setCustomColor] = useState<string | null>(null)
	const [selectedWarehouseQueenId, setSelectedWarehouseQueenId] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [lang, setLang] = useState('en')

	const user = useLiveQuery(() => getUser(), [], null)

	useEffect(() => {
		let currentLang = 'en'
		if (user && user?.lang) {
			currentLang = user.lang
		} else if (user === null) {
			const browserLang = navigator.language.substring(0, 2) as any
			if (SUPPORTED_LANGUAGES.includes(browserLang)) {
				currentLang = browserLang
			}
		}
		setLang(currentLang)
	}, [user])

	const { data: randomNameData, loading: randomNameLoading, reexecuteQuery: reexecuteRandomNameQuery } = useQuery(
		RANDOM_QUEEN_NAME_QUERY,
		{ variables: { language: lang } }
	)

	const { data: warehouseData, loading: warehouseLoading } = useQuery(WAREHOUSE_QUEENS_QUERY)
	const warehouseQueens: WarehouseQueen[] = warehouseData?.warehouseQueens || []
	const hasWarehouseQueens = warehouseQueens.length > 0

	useEffect(() => {
		if (randomNameData?.randomHiveName && !randomNameLoading) {
			setName(randomNameData.randomHiveName)
		}
	}, [randomNameData, randomNameLoading])

	useEffect(() => {
		if (!allowModeSwitch) {
			setMode(initialMode)
		}
	}, [allowModeSwitch, initialMode])

	useEffect(() => {
		if (allowModeSwitch && !warehouseLoading && !hasWarehouseQueens && mode === 'warehouse') {
			setMode('create')
		}
		if (hasWarehouseQueens && !selectedWarehouseQueenId) {
			setSelectedWarehouseQueenId(warehouseQueens[0].id)
		}
	}, [
		allowModeSwitch,
		hasWarehouseQueens,
		mode,
		selectedWarehouseQueenId,
		warehouseLoading,
		warehouseQueens
	])

	const handleRefreshName = useCallback(() => {
		reexecuteRandomNameQuery({ requestPolicy: 'network-only' })
	}, [reexecuteRandomNameQuery])

	const [addQueenMutation, { error: mutationError, loading: createLoading }] = useMutation(`
		mutation addQueenToHive($hiveId: ID!, $queen: FamilyInput!) {
			addQueenToHive(hiveId: $hiveId, queen: $queen) {
				id
				__typename
				name
				race
				added
				color
			}
		}
	`)

	const [assignQueenFromWarehouseMutation, { error: assignMutationError, loading: assignLoading }] = useMutation(`
		mutation assignQueenFromWarehouse($hiveId: ID!, $familyId: ID!) {
			assignQueenFromWarehouse(hiveId: $hiveId, familyId: $familyId) {
				id
				__typename
				name
				race
				added
				color
			}
		}
	`)

	const selectedWarehouseQueen = warehouseQueens.find((queen) => queen.id === selectedWarehouseQueenId)

	const handleSubmit = async () => {
		setError(null)

		try {
			if (mode === 'warehouse') {
				if (!selectedWarehouseQueenId) {
					setError('Please select a queen from warehouse.')
					return
				}

				const result = await assignQueenFromWarehouseMutation({
					hiveId: hiveId.toString(),
					familyId: selectedWarehouseQueenId,
				})

				if (result.data?.assignQueenFromWarehouse) {
					const family = {
						id: +result.data.assignQueenFromWarehouse.id,
						hiveId: hiveId,
						name: result.data.assignQueenFromWarehouse.name,
						race: result.data.assignQueenFromWarehouse.race,
						added: result.data.assignQueenFromWarehouse.added,
						color: result.data.assignQueenFromWarehouse.color,
					}
					await updateFamily(family)
					await new Promise(resolve => setTimeout(resolve, 100))
					onSuccess()
					return
				}

				throw new Error('Failed to assign queen from warehouse')
			}

			if (!race.trim()) {
				setError('Please provide the queen race.')
				return
			}

			if (!year || year.length !== 4) {
				setError('Please provide a valid year (4 digits).')
				return
			}

			const result = await addQueenMutation({
				hiveId: hiveId.toString(),
				queen: {
					name: name.trim() || null,
					race: race.trim(),
					added: year,
					color: customColor,
				},
			})

			if (result.data?.addQueenToHive) {
				const family = {
					id: +result.data.addQueenToHive.id,
					hiveId: hiveId,
					name: result.data.addQueenToHive.name,
					race: result.data.addQueenToHive.race,
					added: result.data.addQueenToHive.added,
					color: result.data.addQueenToHive.color,
				}
				await updateFamily(family)
				await new Promise(resolve => setTimeout(resolve, 100))
				onSuccess()
				return
			}

			throw new Error('Failed to create queen - no family data returned')
		} catch (err) {
			console.error('AddQueenModal: error adding queen:', err)
			setError(err.message || 'Failed to add queen')
		}
	}

	return (
		<Modal title={<T>Add Queen</T>} onClose={onClose}>
			<div className={styles.modalContent}>
				<MessageError error={error || mutationError || assignMutationError} />

				{allowModeSwitch && hasWarehouseQueens && (
					<div className={styles.modeSwitch}>
						<Button
							type="button"
							onClick={() => setMode('create')}
							className={`${styles.modeButton} ${mode === 'create' ? styles.activeMode : ''}`}
						>
							<T>Create New Queen</T>
						</Button>
						<Button
							type="button"
							onClick={() => setMode('warehouse')}
							className={`${styles.modeButton} ${mode === 'warehouse' ? styles.activeMode : ''}`}
						>
							<T>Add From Warehouse</T>
						</Button>
					</div>
				)}

				{mode === 'warehouse' ? (
					<div className={styles.warehouseSelectWrap}>
						<label className={inputStyles.label}><T>Select Queen</T></label>
						<select
							className={inputStyles.input}
							value={selectedWarehouseQueenId}
							onChange={(e: h.JSX.TargetedEvent<HTMLSelectElement, Event>) =>
								setSelectedWarehouseQueenId((e.target as HTMLSelectElement).value)
							}
							disabled={warehouseLoading}
						>
							{warehouseQueens.map((queen) => (
								<option key={queen.id} value={queen.id}>
									{queen.name || `#${queen.id}`} {queen.added ? `(${queen.added})` : ''}
								</option>
							))}
						</select>

						{selectedWarehouseQueen && (
							<div className={styles.warehousePreview}>
								<QueenColor
									year={selectedWarehouseQueen.added || currentYear}
									color={selectedWarehouseQueen.color || null}
								/>
								<div>
									<div>{selectedWarehouseQueen.name || <T>Unnamed Queen</T>}</div>
									<div className={styles.previewMeta}>{selectedWarehouseQueen.added || '-'}</div>
									<div className={styles.previewMeta}>{selectedWarehouseQueen.race || <T>Race unknown</T>}</div>
								</div>
							</div>
						)}
					</div>
				) : (
					<>
						<div className={styles.nameInputWrapper}>
							<div style="flex: 1;">
								<label className={inputStyles.label}><T>Queen Name</T></label>
								<input
									className={inputStyles.input}
									type="text"
									value={name}
									onChange={(e: h.JSX.TargetedEvent<HTMLInputElement, Event>) => setName((e.target as HTMLInputElement).value)}
									autoFocus
									placeholder="Enter queen name"
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
							value={race}
							onChange={(e: h.JSX.TargetedEvent<HTMLInputElement, Event>) => setRace((e.target as HTMLInputElement).value)}
							placeholder="e.g. Carniolan, Italian, etc."
						/>

						<div className={styles.yearInputWrapper}>
							<div>
								<label className={inputStyles.label}><T>Year</T></label>
								<input
									className={inputStyles.input}
									type="text"
									value={year}
									maxLength={4}
									onChange={(e: h.JSX.TargetedEvent<HTMLInputElement, Event>) => {
										setYear((e.target as HTMLInputElement).value)
										setCustomColor(null)
									}}
								/>
							</div>
							<div className={styles.colorPickerWrapper}>
								<QueenColorPicker
									year={year}
									color={customColor}
									onColorChange={(value: string) => setCustomColor(value)}
								/>
							</div>
						</div>
					</>
				)}

				<div className={styles.buttonContainer}>
					<Button onClick={handleSubmit} loading={createLoading || assignLoading} color="green">
						{mode === 'warehouse' ? <T>Add From Warehouse</T> : <T>Add Queen</T>}
					</Button>
				</div>
			</div>
		</Modal>
	)
}
