import { useState, useEffect, useCallback } from 'preact/hooks'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMutation, useQuery, gql } from '@/api'
import T, { useTranslation as t } from '@/shared/translate'
import Modal from '@/shared/modal'
import Button from '@/shared/button'
import MessageError from '@/shared/messageError'
import { updateFamily } from '@/models/family'
import { getUser } from '@/models/user'
import { SUPPORTED_LANGUAGES } from '@/config/languages'
import QueenFormFields, {
	QueenFormMode,
	WarehouseQueen,
} from './QueenFormFields'
import styles from './AddQueenModal.module.less'
import { addHiveLog, hiveLogActions } from '@/models/hiveLog'

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

type ModalMode = QueenFormMode

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
	const tNewQueenIntroduced = t('New queen introduced')
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
					await addHiveLog({
						hiveId: +hiveId,
						action: hiveLogActions.QUEEN,
						title: 'Queen assigned from warehouse',
						details: `${family.name || `#${family.id}`} was assigned to this hive.`,
					})
					await new Promise(resolve => setTimeout(resolve, 100))
					onSuccess()
					return
				}

				throw new Error('Failed to assign queen from warehouse')
			}

			if (!year || year.length !== 4) {
				setError('Please provide a valid year (4 digits).')
				return
			}

			const trimmedRace = race.trim()
			const result = await addQueenMutation({
				hiveId: hiveId.toString(),
				queen: {
					name: name.trim() || null,
					race: trimmedRace || null,
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
				await addHiveLog({
					hiveId: +hiveId,
					action: hiveLogActions.QUEEN,
					title: tNewQueenIntroduced,
					details: `${family.name || `#${family.id}`} (${family.added || 'year unknown'}).`,
				})
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

				<QueenFormFields
					mode={mode}
					allowModeSwitch={allowModeSwitch}
					warehouseQueens={warehouseQueens}
					warehouseLoading={warehouseLoading}
					selectedWarehouseQueenId={selectedWarehouseQueenId}
					name={name}
					race={race}
					year={year}
					customColor={customColor}
					randomNameLoading={randomNameLoading}
					autoFocusName
					onModeChange={setMode}
					onSelectedWarehouseQueenIdChange={setSelectedWarehouseQueenId}
					onNameChange={setName}
					onRaceChange={setRace}
					onYearChange={setYear}
					onCustomColorChange={setCustomColor}
					onRefreshName={handleRefreshName}
				/>

				<div className={styles.buttonContainer}>
					<Button onClick={handleSubmit} loading={createLoading || assignLoading} color="green">
						{mode === 'warehouse' ? <T>Add From Warehouse</T> : <T>Add Queen</T>}
					</Button>
				</div>
			</div>
		</Modal>
	)
}
