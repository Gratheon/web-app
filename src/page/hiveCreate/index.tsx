import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { apiClient, useMutation, useQuery } from '@/api'
import { getUser } from '@/models/user'
import { updateFamily } from '@/models/family'

import VisualForm from '@/shared/visualForm'
import HiveIcon from '@/shared/hive'
import ErrorMsg from '@/shared/messageError'
import Button from '@/shared/button'
import T from '@/shared/translate'
import BillingUpgradeNotice from '@/shared/billingUpgradeNotice'
import {
	getHiveLimitForBillingTier,
	isBillingTierAtLeast,
} from '@/shared/billingTier'
import MessageSuccess from '@/shared/messageSuccess'
import { SUPPORTED_LANGUAGES } from '@/config/languages'

import { Box, boxTypes } from '@/models/boxes'
import PagePaddedCentered from '@/shared/pagePaddedCentered'
import { useWarehouseAutoAdjust } from '@/hooks/useWarehouseAutoAdjust'
import QueenFormFields, {
	QueenFormMode,
} from '@/page/hiveEdit/hiveTopInfo/QueenFormFields'

import HiveCreateFields from './HiveCreateFields'
import {
	ADD_HIVE_MUTATION,
	ADD_QUEEN_TO_HIVE_MUTATION,
	ASSIGN_QUEEN_FROM_WAREHOUSE_MUTATION,
	BOX_SYSTEMS_QUERY,
	HIVE_CREATE_DEDUCTION_CONTEXT_QUERY,
	HIVE_CREATION_LIMIT_QUERY,
	RANDOM_QUEEN_NAME_QUERY,
	SET_WAREHOUSE_INVENTORY_COUNT_MUTATION,
	WAREHOUSE_INVENTORY_QUERY,
	WAREHOUSE_QUEENS_QUERY,
} from './queries'
import {
	createDefaultBoxes,
	getFrameModuleTypeByCode,
	getModuleInventoryKeys,
	getSystemIdFromBoxInventoryKey,
	resolveWarehouseModuleTypeForBox,
} from './hiveCreateUtils'
import styles from './styles.module.less'

type QueenDraft = {
	clientId: string
	mode: QueenFormMode
	name: string
	race: string
	year: string
	customColor: string | null
	selectedWarehouseQueenId: string
}

function createQueenDraft(year = new Date().getFullYear().toString()): QueenDraft {
	return {
		clientId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
		mode: 'create',
		name: '',
		race: '',
		year,
		customColor: null,
		selectedWarehouseQueenId: '',
	}
}

export default function HiveCreateForm() {
	let { id } = useParams()
	let [hiveType, setHiveType] = useState('vertical')
	let [boxCount, setBoxCount] = useState(1)
	const [boxes, setBoxes] = useState(createDefaultBoxes('vertical', boxCount))

	let navigate = useNavigate()
	let [frameCount, setFrameCount] = useState(10)
	let [hiveNumber, setHiveNumber] = useState<number | undefined>(undefined)
	const [submitError, setSubmitError] = useState<any>(null)
	const [hasHiveLimitBackendError, setHasHiveLimitBackendError] =
		useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	let user = useLiveQuery(() => getUser(), [], null)
	const currentYear = new Date().getFullYear().toString()
	const [queenDrafts, setQueenDrafts] = useState<QueenDraft[]>([
		createQueenDraft(currentYear),
	])
	const [lang, setLang] = useState('en')
	const [refreshQueenDraftId, setRefreshQueenDraftId] = useState<string | null>(null)
	const { data: randomNameData, loading: randomNameLoading, reexecuteQuery: reexecuteRandomNameQuery } = useQuery(
		RANDOM_QUEEN_NAME_QUERY,
		{ variables: { language: lang } }
	)
	const { data: warehouseQueensData, loading: warehouseQueensLoading } = useQuery(
		WAREHOUSE_QUEENS_QUERY
	)
	const warehouseQueens = warehouseQueensData?.warehouseQueens || []
	const [addQueenToHive] = useMutation(ADD_QUEEN_TO_HIVE_MUTATION)
	const [assignQueenFromWarehouse] = useMutation(
		ASSIGN_QUEEN_FROM_WAREHOUSE_MUTATION
	)
	const { data: hiveLimitData } = useQuery(HIVE_CREATION_LIMIT_QUERY, {
		requestPolicy: 'network-only',
	})
	const { data: boxSystemsData } = useQuery(BOX_SYSTEMS_QUERY)
	const { data: warehouseInventoryData } = useQuery(WAREHOUSE_INVENTORY_QUERY)
	const [boxSystemId, setBoxSystemId] = useState<string | undefined>(undefined)
	const [isBoxSystemOpen, setIsBoxSystemOpen] = useState(false)
	const { decreaseWarehouseForType, decreaseWarehouseForFrameBy } =
		useWarehouseAutoAdjust()
	const [setWarehouseInventoryCount] = useMutation(
		SET_WAREHOUSE_INVENTORY_COUNT_MUTATION
	)
	const boxSystemPickerRef = useRef<HTMLDivElement | null>(null)
	const boxSystems = boxSystemsData?.boxSystems || []
	const boxSystemFrameSettings = boxSystemsData?.boxSystemFrameSettings || []
	const warehouseInventory = warehouseInventoryData?.warehouseInventory || []
	const selectedBoxSystem =
		boxSystems.find((system: any) => system.id === boxSystemId) ||
		boxSystems.find((system: any) => system.isDefault) ||
		boxSystems[0]
	const selectedSystemId =
		hiveType === 'horizontal' ? '' : String(selectedBoxSystem?.id || '')
	const frameSourceByTargetAndModuleType = useMemo(() => {
		return (boxSystemFrameSettings || []).reduce(
			(acc: Record<string, string>, setting: any) => {
				const moduleType =
					setting.boxType === 'DEEP'
						? 'DEEP'
						: setting.boxType === 'SUPER'
						? 'SUPER'
						: setting.boxType === 'LARGE_HORIZONTAL_SECTION'
						? 'LARGE_HORIZONTAL_SECTION'
						: ''
				if (!moduleType) return acc
				acc[`${setting.systemId}:${moduleType}`] = String(
					setting.frameSourceSystemId || setting.systemId
				)
				return acc
			},
			{}
		)
	}, [boxSystemFrameSettings])

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

	useEffect(() => {
		if (!randomNameData?.randomHiveName || randomNameLoading) return
		setQueenDrafts((drafts) => {
			if (!drafts.length) return drafts
			return drafts.map((draft, index) => {
				const isRefreshTarget = refreshQueenDraftId
					? draft.clientId === refreshQueenDraftId
					: index === 0 && draft.mode === 'create' && !draft.name
				if (!isRefreshTarget) return draft
				return { ...draft, name: randomNameData.randomHiveName }
			})
		})
		setRefreshQueenDraftId(null)
	}, [randomNameData, randomNameLoading, refreshQueenDraftId])

	useEffect(() => {
		if (!warehouseQueens.length) return
		setQueenDrafts((drafts) =>
			drafts.map((draft) => {
				if (draft.selectedWarehouseQueenId) return draft
				return { ...draft, selectedWarehouseQueenId: warehouseQueens[0].id }
			})
		)
	}, [warehouseQueens])

	const resolveEffectiveFrameSourceSystemId = useCallback(
		(targetSystemId: string, moduleType: string): string => {
			let current = String(targetSystemId || '')
			const visited = new Set<string>()
			while (current && !visited.has(current)) {
				visited.add(current)
				const mapped =
					frameSourceByTargetAndModuleType[`${current}:${moduleType}`]
				if (!mapped || mapped === current) return current
				current = mapped
			}
			return String(targetSystemId || '')
		},
		[frameSourceByTargetAndModuleType]
	)

	useEffect(() => {
		if (hiveType === 'horizontal') return
		if (boxSystemId) return
		const systems = boxSystems
		if (!systems.length) return
		const defaultSystem = systems.find((s: any) => s.isDefault) || systems[0]
		setBoxSystemId(defaultSystem.id)
	}, [boxSystems, boxSystemId, hiveType])

	useEffect(() => {
		if (!isBoxSystemOpen) return
		const onDocumentClick = (event: MouseEvent) => {
			if (!boxSystemPickerRef.current) return
			if (boxSystemPickerRef.current.contains(event.target as Node)) return
			setIsBoxSystemOpen(false)
		}
		const onEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') setIsBoxSystemOpen(false)
		}
		document.addEventListener('mousedown', onDocumentClick)
		document.addEventListener('keydown', onEscape)
		return () => {
			document.removeEventListener('mousedown', onDocumentClick)
			document.removeEventListener('keydown', onEscape)
		}
	}, [isBoxSystemOpen])

	const updateHiveDimensions = (newBoxCount, newFrameCount) => {
		setBoxCount(newBoxCount)
		setFrameCount(newFrameCount)
		setBoxes(createDefaultBoxes(hiveType, newBoxCount))
	}

	const currentBillingPlan = user?.billingPlan || 'free'
	const hiveLimit = getHiveLimitForBillingTier(currentBillingPlan)
	const activeHiveCount = (hiveLimitData?.apiaries || []).reduce(
		(count, apiary) => {
			return count + (apiary?.hives?.length || 0)
		},
		0
	)
	const isHiveLimitReachedByCount = activeHiveCount >= hiveLimit
	const isHiveLimitReached =
		isHiveLimitReachedByCount || hasHiveLimitBackendError
	const displayedHiveCount = hasHiveLimitBackendError
		? hiveLimit
		: activeHiveCount
	const canUseWarehouse = isBillingTierAtLeast(currentBillingPlan, 'hobbyist')
	const requiredSectionModuleType =
		hiveType === 'horizontal'
			? 'LARGE_HORIZONTAL_SECTION'
			: hiveType === 'nucleus'
			? 'NUCS'
			: 'DEEP'
	const requiredFrameModuleType =
		hiveType === 'horizontal' ? 'LARGE_HORIZONTAL_SECTION' : 'DEEP'
	const requiredSectionCount = Math.max(0, Math.floor(Number(boxCount) || 0))
	const requiredFrameCount =
		Math.max(0, Math.floor(Number(boxCount) || 0)) *
		Math.max(0, Math.floor(Number(frameCount) || 0))

	const warehouseWarning = useMemo(() => {
		if (
			!canUseWarehouse ||
			!warehouseInventory?.length ||
			requiredSectionCount <= 0
		)
			return null

		const preferredSectionSystemId =
			requiredSectionModuleType === 'NUCS' && selectedSystemId
				? resolveEffectiveFrameSourceSystemId(selectedSystemId, 'DEEP')
				: selectedSystemId

		const sectionItems = warehouseInventory.filter((item: any) => {
			return (
				item?.kind === 'BOX_MODULE' &&
				String(item?.moduleType || '') === requiredSectionModuleType
			)
		})
		const directSectionItem = sectionItems.find(
			(item: any) =>
				getSystemIdFromBoxInventoryKey(item?.key) === preferredSectionSystemId
		)
		const directSectionCount = Math.max(
			0,
			Number(directSectionItem?.count) || 0
		)
		const totalSectionCount = sectionItems.reduce(
			(sum: number, item: any) => sum + Math.max(0, Number(item?.count) || 0),
			0
		)

		const frameItems = warehouseInventory.filter((item: any) => {
			if (item?.kind !== 'FRAME_SPEC') return false
			return (
				getFrameModuleTypeByCode(item?.frameSpec?.code) ===
				requiredFrameModuleType
			)
		})
		const effectiveFrameSourceSystemId = selectedSystemId
			? resolveEffectiveFrameSourceSystemId(
					selectedSystemId,
					requiredFrameModuleType
			  )
			: ''
		const directFrameItems = frameItems.filter(
			(item: any) =>
				String(item?.frameSpec?.systemId || '') === effectiveFrameSourceSystemId
		)
		const directFrameCount = directFrameItems.reduce(
			(sum: number, item: any) => sum + Math.max(0, Number(item?.count) || 0),
			0
		)
		const totalFrameCount = frameItems.reduce(
			(sum: number, item: any) => sum + Math.max(0, Number(item?.count) || 0),
			0
		)

		const sectionShortageCertain = preferredSectionSystemId
			? directSectionCount < requiredSectionCount
			: totalSectionCount < requiredSectionCount
		const sectionMissing = preferredSectionSystemId
			? Math.max(0, requiredSectionCount - directSectionCount)
			: Math.max(0, requiredSectionCount - totalSectionCount)
		const sectionRisk =
			!!preferredSectionSystemId &&
			!directSectionItem &&
			totalSectionCount >= requiredSectionCount

		const frameShortageCertain =
			requiredFrameCount > 0 &&
			(selectedSystemId
				? directFrameCount < requiredFrameCount
				: totalFrameCount < requiredFrameCount)
		const frameMissing =
			requiredFrameCount > 0
				? selectedSystemId
					? Math.max(0, requiredFrameCount - directFrameCount)
					: Math.max(0, requiredFrameCount - totalFrameCount)
				: 0
		const frameRisk =
			requiredFrameCount > 0 &&
			!!selectedSystemId &&
			directFrameItems.length === 0 &&
			totalFrameCount >= requiredFrameCount

		if (
			!sectionShortageCertain &&
			!sectionRisk &&
			!frameShortageCertain &&
			!frameRisk
		)
			return null

		const parts: string[] = []
		if (sectionShortageCertain && sectionMissing > 0) {
			parts.push(`certain shortage: sections missing ${sectionMissing}`)
		} else if (sectionRisk) {
			parts.push('risk: section stock for this box system is uncertain')
		}
		if (frameShortageCertain && frameMissing > 0) {
			parts.push(`certain shortage: frames missing ${frameMissing}`)
		} else if (frameRisk) {
			parts.push('risk: frame stock for this box system is uncertain')
		}

		return parts.length ? parts.join(' • ') : null
	}, [
		canUseWarehouse,
		warehouseInventory,
		requiredSectionModuleType,
		requiredFrameModuleType,
		selectedSystemId,
		requiredSectionCount,
		requiredFrameCount,
		resolveEffectiveFrameSourceSystemId,
	])

	let [addHive] = useMutation(ADD_HIVE_MUTATION, { errorPolicy: 'all' })

	async function applyWarehouseDeductionsForCreatedHive(hiveId: string) {
		if (!hiveId) return

		try {
			const result = await apiClient
				.query(
					HIVE_CREATE_DEDUCTION_CONTEXT_QUERY,
					{ id: String(hiveId) },
					{ requestPolicy: 'network-only' }
				)
				.toPromise()

			const createdHiveType = String(result?.data?.hive?.hiveType || '')
			const createdHiveSystemId = String(selectedSystemId || '')
			const createdBoxes = result?.data?.hive?.boxes || []
			const inventoryCountsByKey = (warehouseInventory || []).reduce(
				(acc: Record<string, number>, item: any) => {
					const key = String(item?.key || '')
					if (!key) return acc
					acc[key] = Math.max(0, Number(item?.count) || 0)
					return acc
				},
				{}
			)

			async function decreaseWarehouseModuleBy(
				moduleType: string,
				amount = 1,
				preferredModuleSystemId?: string
			) {
				let remaining = Math.max(0, Math.floor(amount))
				if (!moduleType || remaining <= 0) return

				const candidateKeys = getModuleInventoryKeys(
					moduleType,
					warehouseInventory,
					preferredModuleSystemId
				)
				if (!candidateKeys.length) {
					await decreaseWarehouseForType(moduleType)
					return
				}
				for (const key of candidateKeys) {
					if (remaining <= 0) break
					const available = Math.max(0, Number(inventoryCountsByKey[key]) || 0)
					if (available <= 0) continue
					const take = Math.min(available, remaining)
					const nextValue = Math.max(0, available - take)

					const updateResult = await setWarehouseInventoryCount({
						itemKey: key,
						count: nextValue,
					})
					const confirmed = Math.max(
						0,
						Number(
							updateResult?.data?.setWarehouseInventoryCount?.count ?? nextValue
						) || 0
					)
					inventoryCountsByKey[key] = confirmed
					remaining -= take
				}
			}

			for (const createdBox of createdBoxes) {
				const moduleType = resolveWarehouseModuleTypeForBox(
					createdBox?.type,
					createdHiveType
				)
				if (moduleType) {
					const preferredModuleSystemId =
						moduleType === 'NUCS' && createdHiveSystemId
							? resolveEffectiveFrameSourceSystemId(createdHiveSystemId, 'DEEP')
							: createdHiveSystemId
					await decreaseWarehouseModuleBy(
						moduleType,
						1,
						preferredModuleSystemId
					)
				}

				const frameTypeCounts = (createdBox?.frames || []).reduce(
					(acc: Record<string, number>, frame: any) => {
						const frameType = String(frame?.type || '')
						if (!frameType) return acc
						acc[frameType] = (acc[frameType] || 0) + 1
						return acc
					},
					{}
				)

				for (const [frameType, count] of Object.entries(frameTypeCounts)) {
					await decreaseWarehouseForFrameBy(
						createdBox.id,
						frameType,
						Number(count) || 0
					)
				}
			}
		} catch (e) {
			console.error(
				'Failed to auto-deduct warehouse items after hive creation',
				e
			)
		}
	}

	const handleHiveTypeChange = (event) => {
		const newHiveType = event.target.value
		setHiveType(newHiveType)
		if (newHiveType === 'vertical') {
			setBoxCount(1)
			setFrameCount(10)
			setBoxes(createDefaultBoxes(newHiveType, 1))
		} else if (newHiveType === 'horizontal') {
			setBoxCount(1)
			setFrameCount(20)
			setBoxes(createDefaultBoxes(newHiveType, 1))
		} else if (newHiveType === 'nucleus') {
			setBoxCount(1)
			setFrameCount(5)
			setBoxes(createDefaultBoxes(newHiveType, 1))
		}
	}

	function updateQueenDraft(clientId: string, patch: Partial<QueenDraft>) {
		setQueenDrafts((drafts) =>
			drafts.map((draft) =>
				draft.clientId === clientId ? { ...draft, ...patch } : draft
			)
		)
	}

	function addQueenDraft() {
		setQueenDrafts((drafts) => [
			...drafts,
			{
				...createQueenDraft(currentYear),
				selectedWarehouseQueenId: warehouseQueens[0]?.id || '',
			},
		])
	}

	function removeQueenDraft(clientId: string) {
		setQueenDrafts((drafts) => drafts.filter((draft) => draft.clientId !== clientId))
	}

	function validateQueenDrafts() {
		for (const draft of queenDrafts) {
			if (draft.mode === 'warehouse') {
				if (!draft.selectedWarehouseQueenId) {
					return 'Please select a queen from warehouse.'
				}
				continue
			}

			if (!draft.year || draft.year.length !== 4) {
				return 'Please provide a valid queen year (4 digits).'
			}
		}
		return null
	}

	async function applySelectedQueensToCreatedHive(hiveId: string) {
		for (const draft of queenDrafts) {
			if (draft.mode === 'warehouse') {
				if (!draft.selectedWarehouseQueenId) {
					throw new Error('Please select a queen from warehouse.')
				}
				const result = await assignQueenFromWarehouse({
					hiveId,
					familyId: draft.selectedWarehouseQueenId,
				})
				const family = result?.data?.assignQueenFromWarehouse
				if (!family?.id) throw new Error('Failed to assign queen from warehouse')
				await updateFamily({
					id: +family.id,
					hiveId: +hiveId,
					name: family.name,
					race: family.race,
					added: family.added,
					color: family.color,
				})
				continue
			}

			if (!draft.year || draft.year.length !== 4) {
				throw new Error('Please provide a valid queen year (4 digits).')
			}
			const result = await addQueenToHive({
				hiveId,
				queen: {
					name: draft.name.trim() || null,
					race: draft.race.trim() || null,
					added: draft.year,
					color: draft.customColor,
				},
			})
			const family = result?.data?.addQueenToHive
			if (!family?.id) throw new Error('Failed to create queen')
			await updateFamily({
				id: +family.id,
				hiveId: +hiveId,
				name: family.name,
				race: family.race,
				added: family.added,
				color: family.color,
			})
		}
	}

	async function onSubmit(e) {
		e.preventDefault()
		if (isSubmitting) {
			return
		}
		setSubmitError(null)
		setHasHiveLimitBackendError(false)
		if (isHiveLimitReached) {
			setSubmitError('Hive limit reached for your billing plan.')
			return
		}
		const queenDraftError = validateQueenDrafts()
		if (queenDraftError) {
			setSubmitError(queenDraftError)
			return
		}

		setIsSubmitting(true)
		let result
		try {
			result = await addHive({
				apiaryId: id,
				hiveNumber: hiveNumber || undefined,
				hiveType:
					hiveType === 'horizontal'
						? 'HORIZONTAL'
						: hiveType === 'nucleus'
						? 'NUCLEUS'
						: 'VERTICAL',
				boxCount,
				frameCount,
				initialBoxType:
					hiveType === 'horizontal'
						? boxTypes.LARGE_HORIZONTAL_SECTION
						: boxTypes.DEEP,
				boxSystemId:
					hiveType === 'horizontal' ? undefined : boxSystemId || undefined,
				colors: boxes.map((b: Box) => {
					return b.color
				}),
			})

			if (result?.error || !result?.data?.addHive?.id) {
				const errorText = String(result?.error || '')
				if (errorText.toLowerCase().includes('hive limit reached')) {
					setHasHiveLimitBackendError(true)
					setSubmitError('Hive limit reached for your billing plan.')
					return
				}
				setSubmitError(result?.error || new Error('Failed to create hive'))
				return
			}

			const createdHiveId = String(result.data.addHive.id)
			await applySelectedQueensToCreatedHive(createdHiveId)
			await applyWarehouseDeductionsForCreatedHive(createdHiveId)

			navigate(`/apiaries/${id}/hives/${createdHiveId}`, {
				replace: true,
				state: {
					title: 'Hive added successfully',
					message: 'Try adding frame photos',
				},
			})
		} catch (error) {
			setSubmitError(error)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<PagePaddedCentered>
			<h1>
				<T>New Hive</T>
			</h1>
			{isHiveLimitReached && (
				<div style={{ marginBottom: 20 }}>
					<BillingUpgradeNotice
						title={
							<>
								<T>
									You reached your hive limit for this billing tier. Please
									upgrade to create more hives.
								</T>{' '}
								({displayedHiveCount}/{hiveLimit})
							</>
						}
					/>
				</div>
			)}
			{submitError && <ErrorMsg error={submitError} />}
			{warehouseWarning ? (
				<div style={{ marginBottom: 12 }}>
					<MessageSuccess
						isWarning
						className={styles.warehouseWarning}
						title={<T>Warehouse warning</T>}
						message={
							<>
								{warehouseWarning}.{' '}
								<T>
									Hive creation will continue. Missing parts are assumed to come
									from outside your warehouse.
								</T>
							</>
						}
					/>
				</div>
			) : null}
			<div style={{ textAlign: 'center', marginBottom: 20 }}>
				<HiveIcon
					boxes={boxes}
					editable={true}
					hiveType={
						hiveType === 'nucleus'
							? 'NUCLEUS'
							: hiveType === 'horizontal'
							? 'HORIZONTAL'
							: 'VERTICAL'
					}
				/>
			</div>

			<VisualForm
				onSubmit={onSubmit.bind(this)}
				submit={
					<Button
						type="submit"
						color="green"
						disabled={isHiveLimitReached || isSubmitting}
					>
						<T>Install</T>
					</Button>
				}
			>
				<HiveCreateFields
					hiveType={hiveType}
					handleHiveTypeChange={handleHiveTypeChange}
					hiveNumber={hiveNumber}
					setHiveNumber={setHiveNumber}
					boxCount={boxCount}
					frameCount={frameCount}
					updateHiveDimensions={updateHiveDimensions}
					setFrameCount={setFrameCount}
					boxSystems={boxSystems}
					selectedBoxSystem={selectedBoxSystem}
					boxSystemId={boxSystemId}
					setBoxSystemId={setBoxSystemId}
					isBoxSystemOpen={isBoxSystemOpen}
					setIsBoxSystemOpen={setIsBoxSystemOpen}
					boxSystemPickerRef={boxSystemPickerRef}
					/>
					<div className={styles.queenCreateSection}>
						<div className={styles.queenCreateHeader}>
							<label className={styles.formLabel}>
								<T>Queens</T>
							</label>
							<Button type="button" size="small" onClick={addQueenDraft}>
								<T>Add Queen</T>
							</Button>
						</div>
						{queenDrafts.length === 0 ? (
							<div className={styles.noQueenNotice}>
								<T>No queen will be added to this hive.</T>
							</div>
						) : null}
						{queenDrafts.map((draft, index) => (
							<div className={styles.queenDraftCard} key={draft.clientId}>
								<div className={styles.queenDraftHeader}>
									<strong><T>Queen</T> {index + 1}</strong>
									<Button type="button" size="small" onClick={() => removeQueenDraft(draft.clientId)}>
										<T>Remove</T>
									</Button>
								</div>
								<QueenFormFields
									mode={draft.mode}
									warehouseQueens={warehouseQueens}
									warehouseLoading={warehouseQueensLoading}
									selectedWarehouseQueenId={draft.selectedWarehouseQueenId}
									name={draft.name}
									race={draft.race}
									year={draft.year}
									customColor={draft.customColor}
									randomNameLoading={randomNameLoading && refreshQueenDraftId === draft.clientId}
									onModeChange={(mode) => updateQueenDraft(draft.clientId, { mode })}
									onSelectedWarehouseQueenIdChange={(selectedWarehouseQueenId) => updateQueenDraft(draft.clientId, { selectedWarehouseQueenId })}
									onNameChange={(name) => updateQueenDraft(draft.clientId, { name })}
									onRaceChange={(race) => updateQueenDraft(draft.clientId, { race })}
									onYearChange={(year) => updateQueenDraft(draft.clientId, { year })}
									onCustomColorChange={(customColor) => updateQueenDraft(draft.clientId, { customColor })}
									onRefreshName={() => {
										setRefreshQueenDraftId(draft.clientId)
										reexecuteRandomNameQuery({ requestPolicy: 'network-only' })
									}}
								/>
							</div>
						))}
					</div>
				</VisualForm>
		</PagePaddedCentered>
	)
}
