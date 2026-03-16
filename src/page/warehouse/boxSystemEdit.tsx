import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { gql, useMutation, useQuery } from '@/api'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import PagePaddedCentered from '@/shared/pagePaddedCentered'
import T from '@/shared/translate'
import VisualForm from '@/shared/visualForm'
import {
	applyFrameSourceToAllBoxTypes,
	buildFrameSettingLookup,
	type BoxSystemFrameSetting,
	FRAME_BOX_TYPE_ORDER,
	getCurrentFrameProfileSource,
	hasExplicitOwnFrameMapping,
} from './boxSystemProfiles'
import styles from './style.module.less'

type BoxSystem = {
	id: string
	name: string
	isDefault: boolean
	boxProfileSourceSystemId?: string | null
}

type EditableBoxType = 'DEEP' | 'SUPER'

type BoxSpec = {
	id: string
	systemId: string
	code: string
	legacyBoxType: EditableBoxType
	displayName: string
	internalWidthMm?: number | null
	internalLengthMm?: number | null
	internalHeightMm?: number | null
	externalWidthMm?: number | null
	externalLengthMm?: number | null
	frameWidthMm?: number | null
	frameHeightMm?: number | null
}

type BoxSpecDimensionDraft = {
	internalWidthMm: string
	internalLengthMm: string
	internalHeightMm: string
	externalWidthMm: string
	externalLengthMm: string
	frameWidthMm: string
	frameHeightMm: string
}

type DimensionFieldKey = keyof BoxSpecDimensionDraft

const EDITABLE_BOX_TYPES: EditableBoxType[] = ['DEEP', 'SUPER']

const EMPTY_DIMENSION_DRAFT: BoxSpecDimensionDraft = {
	internalWidthMm: '',
	internalLengthMm: '',
	internalHeightMm: '',
	externalWidthMm: '',
	externalLengthMm: '',
	frameWidthMm: '',
	frameHeightMm: '',
}

const LANGSTROTH_DEFAULTS_BY_TYPE: Record<EditableBoxType, BoxSpecDimensionDraft> = {
	DEEP: {
		internalWidthMm: '465',
		internalLengthMm: '375',
		internalHeightMm: '244',
		externalWidthMm: '',
		externalLengthMm: '',
		frameWidthMm: '448',
		frameHeightMm: '232',
	},
	SUPER: {
		internalWidthMm: '465',
		internalLengthMm: '375',
		internalHeightMm: '168',
		externalWidthMm: '',
		externalLengthMm: '',
		frameWidthMm: '448',
		frameHeightMm: '159',
	},
}

function fromDraftValue(value: string): number | null {
	const trimmed = String(value || '').trim()
	if (!trimmed) return null
	const parsed = Number.parseInt(trimmed, 10)
	if (!Number.isFinite(parsed) || parsed < 0) return null
	return parsed
}

function getDimensionValidationState(draft: BoxSpecDimensionDraft): {
	errorCode: 'FRAME_WIDTH' | 'FRAME_HEIGHT' | 'EXTERNAL_WIDTH' | 'EXTERNAL_LENGTH' | null
	frameWidthInvalid: boolean
	frameHeightInvalid: boolean
	externalWidthInvalid: boolean
	externalLengthInvalid: boolean
} {
	const internalWidth = fromDraftValue(draft.internalWidthMm)
	const frameWidth = fromDraftValue(draft.frameWidthMm)
	const internalHeight = fromDraftValue(draft.internalHeightMm)
	const frameHeight = fromDraftValue(draft.frameHeightMm)
	const internalLength = fromDraftValue(draft.internalLengthMm)
	const externalWidth = fromDraftValue(draft.externalWidthMm)
	const externalLength = fromDraftValue(draft.externalLengthMm)
	const frameWidthInvalid = internalWidth !== null && frameWidth !== null && frameWidth > internalWidth
	const frameHeightInvalid = internalHeight !== null && frameHeight !== null && frameHeight > internalHeight
	const externalWidthInvalid = internalWidth !== null && externalWidth !== null && externalWidth < internalWidth
	const externalLengthInvalid = internalLength !== null && externalLength !== null && externalLength < internalLength
	const errorCode = frameWidthInvalid
		? 'FRAME_WIDTH'
		: (
			frameHeightInvalid
				? 'FRAME_HEIGHT'
				: (
					externalWidthInvalid
						? 'EXTERNAL_WIDTH'
						: (externalLengthInvalid ? 'EXTERNAL_LENGTH' : null)
				)
		)
	return { errorCode, frameWidthInvalid, frameHeightInvalid, externalWidthInvalid, externalLengthInvalid }
}

function resolveFallbackDimensionValue(
	boxType: EditableBoxType,
	field: DimensionFieldKey,
	isLangstrothSystem: boolean,
): string {
	if (!isLangstrothSystem) return ''
	return LANGSTROTH_DEFAULTS_BY_TYPE[boxType]?.[field] || ''
}

function resolveSpecDimensionValue(
	spec: BoxSpec | undefined,
	field: DimensionFieldKey,
	boxType: EditableBoxType,
	isLangstrothSystem: boolean,
): string {
	const direct = field === 'internalWidthMm' ? spec?.internalWidthMm
		: field === 'internalLengthMm' ? spec?.internalLengthMm
		: field === 'internalHeightMm' ? spec?.internalHeightMm
		: field === 'externalWidthMm' ? spec?.externalWidthMm
		: field === 'externalLengthMm' ? spec?.externalLengthMm
		: field === 'frameWidthMm' ? spec?.frameWidthMm
		: spec?.frameHeightMm
	if (direct === null || direct === undefined) {
		return resolveFallbackDimensionValue(boxType, field, isLangstrothSystem)
	}
	return String(direct)
}

function buildDraftFromSpec(
	spec: BoxSpec | undefined,
	boxType: EditableBoxType,
	isLangstrothSystem: boolean,
): BoxSpecDimensionDraft {
	if (!spec) return { ...EMPTY_DIMENSION_DRAFT }
	return {
		internalWidthMm: resolveSpecDimensionValue(spec, 'internalWidthMm', boxType, isLangstrothSystem),
		internalLengthMm: resolveSpecDimensionValue(spec, 'internalLengthMm', boxType, isLangstrothSystem),
		internalHeightMm: resolveSpecDimensionValue(spec, 'internalHeightMm', boxType, isLangstrothSystem),
		externalWidthMm: resolveSpecDimensionValue(spec, 'externalWidthMm', boxType, isLangstrothSystem),
		externalLengthMm: resolveSpecDimensionValue(spec, 'externalLengthMm', boxType, isLangstrothSystem),
		frameWidthMm: resolveSpecDimensionValue(spec, 'frameWidthMm', boxType, isLangstrothSystem),
		frameHeightMm: resolveSpecDimensionValue(spec, 'frameHeightMm', boxType, isLangstrothSystem),
	}
}

const BOX_SYSTEM_EDIT_QUERY = gql`
query boxSystemEditQuery($systemId: ID!) {
	boxSystems {
		id
		name
		isDefault
		boxProfileSourceSystemId
	}
	boxSystemFrameSettings {
		systemId
		boxType
		frameSourceSystemId
	}
	boxSpecs(systemId: $systemId) {
		id
		systemId
		code
		legacyBoxType
		displayName
		internalWidthMm
		internalLengthMm
		internalHeightMm
		externalWidthMm
		externalLengthMm
		frameWidthMm
		frameHeightMm
	}
}
`

const RENAME_BOX_SYSTEM_MUTATION = gql`
mutation renameBoxSystem($id: ID!, $name: String!) {
	renameBoxSystem(id: $id, name: $name) {
		id
		name
		isDefault
	}
}
`

const SET_BOX_SYSTEM_BOX_PROFILE_SOURCE_MUTATION = gql`
mutation setBoxSystemBoxProfileSource($systemId: ID!, $boxSourceSystemId: ID) {
	setBoxSystemBoxProfileSource(systemId: $systemId, boxSourceSystemId: $boxSourceSystemId)
}
`

const SET_BOX_SYSTEM_FRAME_SOURCE_MUTATION = gql`
mutation setBoxSystemFrameSource($systemId: ID!, $boxType: BoxType!, $frameSourceSystemId: ID!) {
	setBoxSystemFrameSource(
		systemId: $systemId
		boxType: $boxType
		frameSourceSystemId: $frameSourceSystemId
	)
}
`

const SET_BOX_SPEC_DIMENSIONS_MUTATION = gql`
mutation setBoxSpecDimensions(
	$systemId: ID!
	$boxType: BoxType!
	$internalWidthMm: Int
	$internalLengthMm: Int
	$internalHeightMm: Int
	$externalWidthMm: Int
	$externalLengthMm: Int
	$frameWidthMm: Int
	$frameHeightMm: Int
) {
	setBoxSpecDimensions(
		systemId: $systemId
		boxType: $boxType
		internalWidthMm: $internalWidthMm
		internalLengthMm: $internalLengthMm
		internalHeightMm: $internalHeightMm
		externalWidthMm: $externalWidthMm
		externalLengthMm: $externalLengthMm
		frameWidthMm: $frameWidthMm
		frameHeightMm: $frameHeightMm
	)
}
`

export default function WarehouseBoxSystemEditPage() {
	const navigate = useNavigate()
	const params = useParams()
	const systemId = String(params.id || '')
	const [isSaving, setIsSaving] = useState(false)
	const [nameInput, setNameInput] = useState('')
	const [draftUseOwnBoxProfile, setDraftUseOwnBoxProfile] = useState(true)
	const [draftBoxSourceSystemId, setDraftBoxSourceSystemId] = useState('')
	const [draftUseOwnFrameProfile, setDraftUseOwnFrameProfile] = useState(true)
	const [draftFrameSourceSystemId, setDraftFrameSourceSystemId] = useState('')
	const [boxSpecDimensionDraftByType, setBoxSpecDimensionDraftByType] = useState<Record<EditableBoxType, BoxSpecDimensionDraft>>({
		DEEP: { ...EMPTY_DIMENSION_DRAFT },
		SUPER: { ...EMPTY_DIMENSION_DRAFT },
	})
	const [formError, setFormError] = useState<any>(null)

	const { data, loading, error, reexecuteQuery } = useQuery(BOX_SYSTEM_EDIT_QUERY, { variables: { systemId } })
	const [renameBoxSystem, { error: renameError }] = useMutation(RENAME_BOX_SYSTEM_MUTATION)
	const [setBoxSystemBoxProfileSource, { error: setBoxProfileError }] = useMutation(SET_BOX_SYSTEM_BOX_PROFILE_SOURCE_MUTATION)
	const [setBoxSystemFrameSource, { error: setFrameSourceError }] = useMutation(SET_BOX_SYSTEM_FRAME_SOURCE_MUTATION)
	const [setBoxSpecDimensions, { error: setBoxSpecDimensionsError }] = useMutation(SET_BOX_SPEC_DIMENSIONS_MUTATION)

	const boxSystems: BoxSystem[] = useMemo(() => data?.boxSystems || [], [data?.boxSystems])
	const frameSettings: BoxSystemFrameSetting[] = useMemo(() => data?.boxSystemFrameSettings || [], [data?.boxSystemFrameSettings])
	const boxSpecs: BoxSpec[] = useMemo(() => data?.boxSpecs || [], [data?.boxSpecs])
	const system = useMemo(() => boxSystems.find((item: BoxSystem) => item.id === systemId) || null, [boxSystems, systemId])
	const frameSettingBySystemAndType = useMemo(() => buildFrameSettingLookup(frameSettings), [frameSettings])
	const boxSpecByType = useMemo(() => {
		return (boxSpecs || []).reduce<Record<string, BoxSpec>>((acc, spec) => {
			acc[String(spec.legacyBoxType || '')] = spec
			return acc
		}, {})
	}, [boxSpecs])
	const currentFrameSource = system ? getCurrentFrameProfileSource(system.id, frameSettingBySystemAndType) : ''
	const isLangstrothSystem = (system?.name || '').trim().toLowerCase() === 'langstroth'
	const isDefaultSystem = !!system?.isDefault
	const availableSourceSystems = boxSystems.filter((candidate: BoxSystem) => candidate.id !== systemId)
	const currentBoxProfileSource = system?.boxProfileSourceSystemId ? String(system.boxProfileSourceSystemId) : null
	const trimmedNameInput = nameInput.trim()
	const hasNameChanged = !!(system && trimmedNameInput && trimmedNameInput !== system.name)
	const resolvedDraftBoxSourceSystemId = draftUseOwnBoxProfile
		? ''
		: (draftBoxSourceSystemId || currentBoxProfileSource || availableSourceSystems[0]?.id || '')
	const nextBoxProfileSource = draftUseOwnBoxProfile ? null : (resolvedDraftBoxSourceSystemId || null)
	const hasBoxProfileChanged = nextBoxProfileSource !== currentBoxProfileSource
	const resolvedDraftFrameSourceSystemId = draftUseOwnFrameProfile
		? (system?.id || '')
		: (
			draftFrameSourceSystemId
			|| (
				currentFrameSource !== '__MIXED__' && currentFrameSource !== systemId
					? currentFrameSource
					: ''
				)
		)
	const hasOwnFrameMapping = !!system && hasExplicitOwnFrameMapping(system.id, frameSettingBySystemAndType)
	const hasFrameProfileChanged = draftUseOwnFrameProfile
		? !!system && ((isDefaultSystem ? false : currentFrameSource !== system.id) || !hasOwnFrameMapping)
		: !!resolvedDraftFrameSourceSystemId && resolvedDraftFrameSourceSystemId !== currentFrameSource
	const showSectionDimensionRows = draftUseOwnBoxProfile
	const showFrameDimensionRows = draftUseOwnFrameProfile
	const showReferenceDimensions = showSectionDimensionRows || showFrameDimensionRows
	const hasDimensionsChanged = EDITABLE_BOX_TYPES.some((boxType) => {
		const currentSpec = boxSpecByType[boxType]
		const draft = boxSpecDimensionDraftByType[boxType] || EMPTY_DIMENSION_DRAFT
		const effectiveCurrentInternalWidth = fromDraftValue(resolveSpecDimensionValue(currentSpec, 'internalWidthMm', boxType, isLangstrothSystem))
		const effectiveCurrentInternalLength = fromDraftValue(resolveSpecDimensionValue(currentSpec, 'internalLengthMm', boxType, isLangstrothSystem))
		const effectiveCurrentInternalHeight = fromDraftValue(resolveSpecDimensionValue(currentSpec, 'internalHeightMm', boxType, isLangstrothSystem))
		const effectiveCurrentExternalWidth = fromDraftValue(resolveSpecDimensionValue(currentSpec, 'externalWidthMm', boxType, isLangstrothSystem))
		const effectiveCurrentExternalLength = fromDraftValue(resolveSpecDimensionValue(currentSpec, 'externalLengthMm', boxType, isLangstrothSystem))
		const effectiveCurrentFrameWidth = fromDraftValue(resolveSpecDimensionValue(currentSpec, 'frameWidthMm', boxType, isLangstrothSystem))
		const effectiveCurrentFrameHeight = fromDraftValue(resolveSpecDimensionValue(currentSpec, 'frameHeightMm', boxType, isLangstrothSystem))
		const sectionChanged = showSectionDimensionRows && (
			fromDraftValue(draft.internalWidthMm) !== effectiveCurrentInternalWidth
			|| fromDraftValue(draft.internalLengthMm) !== effectiveCurrentInternalLength
			|| fromDraftValue(draft.internalHeightMm) !== effectiveCurrentInternalHeight
			|| fromDraftValue(draft.externalWidthMm) !== effectiveCurrentExternalWidth
			|| fromDraftValue(draft.externalLengthMm) !== effectiveCurrentExternalLength
		)
		const frameChanged = showFrameDimensionRows && (
			fromDraftValue(draft.frameWidthMm) !== effectiveCurrentFrameWidth
			|| fromDraftValue(draft.frameHeightMm) !== effectiveCurrentFrameHeight
		)
		return sectionChanged || frameChanged
	})
	const dimensionValidationByType = useMemo(() => {
		return EDITABLE_BOX_TYPES.reduce<Record<EditableBoxType, {
			frameWidthInvalid: boolean
			frameHeightInvalid: boolean
			externalWidthInvalid: boolean
			externalLengthInvalid: boolean
		}>>((acc, boxType) => {
			const draft = boxSpecDimensionDraftByType[boxType] || EMPTY_DIMENSION_DRAFT
			const validation = getDimensionValidationState(draft)
			acc[boxType] = {
				frameWidthInvalid: showSectionDimensionRows && showFrameDimensionRows ? validation.frameWidthInvalid : false,
				frameHeightInvalid: showSectionDimensionRows && showFrameDimensionRows ? validation.frameHeightInvalid : false,
				externalWidthInvalid: showSectionDimensionRows ? validation.externalWidthInvalid : false,
				externalLengthInvalid: showSectionDimensionRows ? validation.externalLengthInvalid : false,
			}
			return acc
		}, {
			DEEP: { frameWidthInvalid: false, frameHeightInvalid: false, externalWidthInvalid: false, externalLengthInvalid: false },
			SUPER: { frameWidthInvalid: false, frameHeightInvalid: false, externalWidthInvalid: false, externalLengthInvalid: false },
		})
	}, [boxSpecDimensionDraftByType, showSectionDimensionRows, showFrameDimensionRows])
	const hasUnsavedChanges = hasNameChanged || hasBoxProfileChanged || hasFrameProfileChanged || hasDimensionsChanged
	const isSaveDisabled = !system || isSaving || !trimmedNameInput || !hasUnsavedChanges

	useEffect(() => {
		if (!system) return
		setNameInput(system.name)
		setFormError(null)
		setDraftUseOwnBoxProfile(!system.boxProfileSourceSystemId)
		setDraftBoxSourceSystemId(system.boxProfileSourceSystemId ? String(system.boxProfileSourceSystemId) : '')
		if (system.isDefault) {
			setDraftUseOwnFrameProfile(true)
			setDraftFrameSourceSystemId('')
			return
		}
		if (currentFrameSource === system.id) {
			setDraftUseOwnFrameProfile(true)
			setDraftFrameSourceSystemId('')
			return
		}
		setDraftUseOwnFrameProfile(false)
		if (currentFrameSource === '__MIXED__') {
			setDraftFrameSourceSystemId('')
		} else {
			setDraftFrameSourceSystemId(currentFrameSource)
		}
	}, [system?.id, system?.name, system?.boxProfileSourceSystemId, currentFrameSource])

	useEffect(() => {
		setBoxSpecDimensionDraftByType({
			DEEP: buildDraftFromSpec(boxSpecByType.DEEP, 'DEEP', isLangstrothSystem),
			SUPER: buildDraftFromSpec(boxSpecByType.SUPER, 'SUPER', isLangstrothSystem),
		})
	}, [boxSpecByType.DEEP?.id, boxSpecByType.SUPER?.id, isLangstrothSystem])

	if (loading && !data?.boxSystems) return <Loader />
	if (!system) {
		return (
			<PagePaddedCentered>
				<ErrorMsg error={error || new Error('Hive system not found')} />
			</PagePaddedCentered>
		)
	}

	async function onSave() {
		if (!system) return
		setFormError(null)
		const trimmed = nameInput.trim()
		if (!trimmed) {
			setFormError(<T>Name is required.</T>)
			return
		}
		if (!hasUnsavedChanges) return

		if (!draftUseOwnFrameProfile && !resolvedDraftFrameSourceSystemId && currentFrameSource === system.id) {
			setFormError(<T>Please choose an existing frame size system.</T>)
			return
		}
		for (const boxType of EDITABLE_BOX_TYPES) {
			const draft = boxSpecDimensionDraftByType[boxType] || EMPTY_DIMENSION_DRAFT
			const sectionLabel = boxType === 'DEEP' ? 'Deep' : 'Super'
			const validation = getDimensionValidationState(draft)
			if (showSectionDimensionRows && showFrameDimensionRows && validation.errorCode === 'FRAME_WIDTH') {
				setFormError(<><T>{sectionLabel}</T>: <T>Frame width cannot be greater than section internal width.</T></>)
				return
			}
			if (showSectionDimensionRows && showFrameDimensionRows && validation.errorCode === 'FRAME_HEIGHT') {
				setFormError(<><T>{sectionLabel}</T>: <T>Frame height cannot be greater than section internal height.</T></>)
				return
			}
			if (showSectionDimensionRows && validation.errorCode === 'EXTERNAL_WIDTH') {
				setFormError(<><T>{sectionLabel}</T>: <T>Section external width cannot be smaller than section internal width.</T></>)
				return
			}
			if (showSectionDimensionRows && validation.errorCode === 'EXTERNAL_LENGTH') {
				setFormError(<><T>{sectionLabel}</T>: <T>Section external depth cannot be smaller than section internal depth.</T></>)
				return
			}
		}

		setIsSaving(true)
		try {
			let targetSystemId = system.id

			if (hasNameChanged) {
				const renameResult = await renameBoxSystem({ id: system.id, name: trimmed })
				const renamedSystemId = renameResult?.data?.renameBoxSystem?.id ? String(renameResult.data.renameBoxSystem.id) : ''
				if (renamedSystemId) {
					targetSystemId = renamedSystemId
				}
			}

			if (hasBoxProfileChanged) {
				await setBoxSystemBoxProfileSource({
					systemId: targetSystemId,
					boxSourceSystemId: nextBoxProfileSource || null,
				})
			}

			let nextFrameSourceSystemId = resolvedDraftFrameSourceSystemId
			if (targetSystemId !== system.id && draftUseOwnFrameProfile) {
				nextFrameSourceSystemId = targetSystemId
			}

			if (hasFrameProfileChanged && nextFrameSourceSystemId) {
				await applyFrameSourceToAllBoxTypes(
					setBoxSystemFrameSource,
					targetSystemId,
					nextFrameSourceSystemId,
				)
			}

			if (hasDimensionsChanged && !system.isDefault) {
				for (const boxType of EDITABLE_BOX_TYPES) {
					if (!boxSpecByType[boxType]) continue
					const draft = boxSpecDimensionDraftByType[boxType] || EMPTY_DIMENSION_DRAFT
					const currentSpec = boxSpecByType[boxType]
					const nextInternalWidthMm = showSectionDimensionRows ? fromDraftValue(draft.internalWidthMm) : (currentSpec?.internalWidthMm ?? null)
					const nextInternalLengthMm = showSectionDimensionRows ? fromDraftValue(draft.internalLengthMm) : (currentSpec?.internalLengthMm ?? null)
					const nextInternalHeightMm = showSectionDimensionRows ? fromDraftValue(draft.internalHeightMm) : (currentSpec?.internalHeightMm ?? null)
					const nextExternalWidthMm = showSectionDimensionRows ? fromDraftValue(draft.externalWidthMm) : (currentSpec?.externalWidthMm ?? null)
					const nextExternalLengthMm = showSectionDimensionRows ? fromDraftValue(draft.externalLengthMm) : (currentSpec?.externalLengthMm ?? null)
					const nextFrameWidthMm = showFrameDimensionRows ? fromDraftValue(draft.frameWidthMm) : (currentSpec?.frameWidthMm ?? null)
					const nextFrameHeightMm = showFrameDimensionRows ? fromDraftValue(draft.frameHeightMm) : (currentSpec?.frameHeightMm ?? null)
					const hasChangedForType =
						nextInternalWidthMm !== (currentSpec?.internalWidthMm ?? null)
						|| nextInternalLengthMm !== (currentSpec?.internalLengthMm ?? null)
						|| nextInternalHeightMm !== (currentSpec?.internalHeightMm ?? null)
						|| nextExternalWidthMm !== (currentSpec?.externalWidthMm ?? null)
						|| nextExternalLengthMm !== (currentSpec?.externalLengthMm ?? null)
						|| nextFrameWidthMm !== (currentSpec?.frameWidthMm ?? null)
						|| nextFrameHeightMm !== (currentSpec?.frameHeightMm ?? null)
					if (!hasChangedForType) continue
					await setBoxSpecDimensions({
						systemId: targetSystemId,
						boxType,
						internalWidthMm: nextInternalWidthMm,
						internalLengthMm: nextInternalLengthMm,
						internalHeightMm: nextInternalHeightMm,
						externalWidthMm: nextExternalWidthMm,
						externalLengthMm: nextExternalLengthMm,
						frameWidthMm: nextFrameWidthMm,
						frameHeightMm: nextFrameHeightMm,
					})
				}
			}

			await reexecuteQuery({ requestPolicy: 'network-only' })
			if (targetSystemId !== system.id) {
				navigate(`/warehouse/box-systems/${targetSystemId}`, { replace: true })
			}
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<PagePaddedCentered>
			<h2><T>Edit hive system</T></h2>
			<ErrorMsg error={formError || error || renameError || setBoxProfileError || setFrameSourceError || setBoxSpecDimensionsError} />
			<div className={styles.formContainer}>
				<VisualForm
					onSubmit={(event: any) => {
						event.preventDefault()
						onSave()
					}}
					submit={
						<div className={styles.actions}>
							<Button type="button" onClick={() => navigate('/warehouse/box-systems', { replace: true })}>
								<T>Back</T>
							</Button>
							<Button
								type="submit"
								color="green"
								loading={isSaving}
								disabled={isSaveDisabled}
							>
								<T>Save</T>
							</Button>
						</div>
					}
				>
					<div className={styles.formField}>
						<label className={styles.formLabel}><T>Name</T></label>
						<div className={styles.fieldControl}>
							<input
								className={`${styles.flexInput} ${styles.nameInput}`}
								type="text"
								value={nameInput}
								onInput={(event: any) => setNameInput(event.target.value)}
								disabled={isSaving}
							/>
						</div>
					</div>

					<div className={styles.formField}>
						<label className={styles.formLabel}><T>Section sizes profile</T></label>
						<div className={styles.fieldControl}>
							<label className={styles.switchRow}>
								<input
									className={styles.switchInput}
									type="checkbox"
									checked={draftUseOwnBoxProfile}
									disabled={system.isDefault || isSaving}
									onChange={(event: any) => {
										const own = !!event.target.checked
										setDraftUseOwnBoxProfile(own)
										if (!own) {
											setDraftBoxSourceSystemId((prev) => prev || availableSourceSystems[0]?.id || '')
										}
									}}
								/>
								<span className={styles.switchTrack} aria-hidden="true">
									<span className={styles.switchThumb}></span>
								</span>
									<span className={styles.switchLabel}>
									{draftUseOwnBoxProfile ? <T>Use own section sizes</T> : <T>Use existing section size system</T>}
								</span>
							</label>
							{draftUseOwnBoxProfile ? null : (
								<div className={styles.radioGroup}>
									{availableSourceSystems.map((candidate: BoxSystem) => (
											<label
												key={`box-profile-${candidate.id}`}
												className={`${styles.radioOption} ${resolvedDraftBoxSourceSystemId === candidate.id ? styles.radioOptionActive : ''}`}
											>
												<input
													className={styles.radioInput}
													type="radio"
													name={`box-profile-source-${system.id}`}
													value={candidate.id}
													checked={resolvedDraftBoxSourceSystemId === candidate.id}
													disabled={system.isDefault || isSaving}
													onChange={(event: any) => {
														const nextValue = String(event.target.value || '')
														if (!nextValue) return
														setDraftBoxSourceSystemId(nextValue)
													}}
												/>
												<span className={styles.radioMark} aria-hidden="true"></span>
												<span className={styles.radioText}>{candidate.name}</span>
											</label>
										))}
								</div>
							)}
						</div>
					</div>

					<div className={styles.formField}>
						<label className={styles.formLabel}><T>Frame profile</T></label>
						<div className={styles.fieldControl}>
							<label className={styles.switchRow}>
								<input
									className={styles.switchInput}
									type="checkbox"
									checked={draftUseOwnFrameProfile}
									disabled={system.isDefault || isSaving}
									onChange={(event: any) => {
										const own = !!event.target.checked
										setDraftUseOwnFrameProfile(own)
										if (!own) {
											setDraftFrameSourceSystemId((prev) => {
												if (prev) return prev
												if (currentFrameSource !== '__MIXED__' && currentFrameSource !== system.id) return currentFrameSource
												return availableSourceSystems[0]?.id || ''
											})
										}
									}}
								/>
								<span className={styles.switchTrack} aria-hidden="true">
									<span className={styles.switchThumb}></span>
								</span>
									<span className={styles.switchLabel}>
									{draftUseOwnFrameProfile ? <T>Use own frame profile</T> : <T>Use existing frame size system</T>}
								</span>
							</label>
							{draftUseOwnFrameProfile ? null : (
								<>
									{currentFrameSource === '__MIXED__' && !draftFrameSourceSystemId ? (
										<div className={styles.profileHint}>
											<T>Custom mapping is active. Pick one system below to unify frame profile.</T>
										</div>
									) : null}
									<div className={styles.radioGroup}>
										{availableSourceSystems.map((candidate: BoxSystem) => (
												<label
													key={`profile-opt-${system.id}-${candidate.id}`}
													className={`${styles.radioOption} ${resolvedDraftFrameSourceSystemId === candidate.id ? styles.radioOptionActive : ''}`}
												>
													<input
														className={styles.radioInput}
														type="radio"
														name={`frame-profile-source-${system.id}`}
														value={candidate.id}
														checked={resolvedDraftFrameSourceSystemId === candidate.id}
														disabled={system.isDefault || isSaving}
														onChange={(event: any) => {
															const nextValue = String(event.target.value || '')
															if (!nextValue) return
															setDraftFrameSourceSystemId(nextValue)
														}}
													/>
													<span className={styles.radioMark} aria-hidden="true"></span>
													<span className={styles.radioText}>{candidate.name}</span>
												</label>
											))}
									</div>
								</>
							)}
						</div>
					</div>

						{showReferenceDimensions ? <div className={styles.formField}>
							<label className={styles.formLabel}><T>Reference dimensions (mm)</T></label>
							<div className={styles.fieldControl}>
								<div className={styles.dimensionsHint}>
									<T>For reference only. These values do not change hive behavior yet.</T>
								</div>
								<div className={styles.dimensionSections}>
									{EDITABLE_BOX_TYPES.map((boxType: EditableBoxType) => {
										const spec = boxSpecByType[boxType]
										const draft = boxSpecDimensionDraftByType[boxType] || EMPTY_DIMENSION_DRAFT
										const isReadOnly = system.isDefault || isSaving
										const sectionTitle = spec?.displayName || (boxType === 'DEEP' ? 'Deep' : 'Super')
										return (
											<div key={`dim-${boxType}`} className={styles.dimensionTypeSection}>
												<div className={styles.dimensionTypeTitle}>{sectionTitle}</div>
												<div className={styles.dimensionTable}>
													<div className={styles.dimensionHeaderRow}>
														<div className={styles.dimensionHeaderCell}><T>Type</T></div>
													<div className={styles.dimensionHeaderCell}><T>Width</T></div>
													<div className={styles.dimensionHeaderCell}><T>Height</T></div>
													<div className={styles.dimensionHeaderCell}><T>Depth</T></div>
												</div>
												{showSectionDimensionRows ? <div className={styles.dimensionRow}>
													<div className={styles.dimensionLabelCell}><T>Section (internal)</T></div>
														<input
															className={styles.dimensionInput}
															type="number"
															min={0}
															step={1}
															inputMode="numeric"
															value={draft.internalWidthMm}
															disabled={isReadOnly}
															onInput={(event: any) => {
																const digitsOnly = String(event.target.value || '').replace(/[^\d]/g, '')
																setBoxSpecDimensionDraftByType((prev) => ({
																	...prev,
																	[boxType]: { ...(prev[boxType] || EMPTY_DIMENSION_DRAFT), internalWidthMm: digitsOnly },
																}))
															}}
														/>
														<input
															className={styles.dimensionInput}
															type="number"
															min={0}
															step={1}
															inputMode="numeric"
															value={draft.internalHeightMm}
															disabled={isReadOnly}
															onInput={(event: any) => {
																const digitsOnly = String(event.target.value || '').replace(/[^\d]/g, '')
																setBoxSpecDimensionDraftByType((prev) => ({
																	...prev,
																	[boxType]: { ...(prev[boxType] || EMPTY_DIMENSION_DRAFT), internalHeightMm: digitsOnly },
																}))
															}}
														/>
														<input
															className={styles.dimensionInput}
															type="number"
															min={0}
															step={1}
															inputMode="numeric"
															value={draft.internalLengthMm}
															disabled={isReadOnly}
															onInput={(event: any) => {
																const digitsOnly = String(event.target.value || '').replace(/[^\d]/g, '')
																setBoxSpecDimensionDraftByType((prev) => ({
																	...prev,
																	[boxType]: { ...(prev[boxType] || EMPTY_DIMENSION_DRAFT), internalLengthMm: digitsOnly },
																}))
															}}
														/>
												</div> : null}
												{showSectionDimensionRows ? <div className={styles.dimensionRow}>
													<div className={styles.dimensionLabelCell}><T>Section (external)</T></div>
														<input
															className={`${styles.dimensionInput} ${dimensionValidationByType[boxType].externalWidthInvalid ? styles.dimensionInputInvalid : ''}`}
															type="number"
															min={0}
															step={1}
															inputMode="numeric"
															value={draft.externalWidthMm}
															disabled={isReadOnly}
															onInput={(event: any) => {
																const digitsOnly = String(event.target.value || '').replace(/[^\d]/g, '')
																setBoxSpecDimensionDraftByType((prev) => ({
																	...prev,
																	[boxType]: { ...(prev[boxType] || EMPTY_DIMENSION_DRAFT), externalWidthMm: digitsOnly },
																}))
															}}
														/>
														<div className={styles.dimensionNotApplicable}>-</div>
														<input
															className={`${styles.dimensionInput} ${dimensionValidationByType[boxType].externalLengthInvalid ? styles.dimensionInputInvalid : ''}`}
															type="number"
															min={0}
															step={1}
															inputMode="numeric"
															value={draft.externalLengthMm}
															disabled={isReadOnly}
															onInput={(event: any) => {
																const digitsOnly = String(event.target.value || '').replace(/[^\d]/g, '')
																setBoxSpecDimensionDraftByType((prev) => ({
																	...prev,
																	[boxType]: { ...(prev[boxType] || EMPTY_DIMENSION_DRAFT), externalLengthMm: digitsOnly },
																}))
															}}
														/>
												</div> : null}
												{showFrameDimensionRows ? <div className={styles.dimensionRow}>
													<div className={styles.dimensionLabelCell}><T>Frame</T></div>
														<input
															className={`${styles.dimensionInput} ${dimensionValidationByType[boxType].frameWidthInvalid ? styles.dimensionInputInvalid : ''}`}
															type="number"
															min={0}
															step={1}
															inputMode="numeric"
															value={draft.frameWidthMm}
															disabled={isReadOnly}
															onInput={(event: any) => {
																const digitsOnly = String(event.target.value || '').replace(/[^\d]/g, '')
																setBoxSpecDimensionDraftByType((prev) => ({
																	...prev,
																	[boxType]: { ...(prev[boxType] || EMPTY_DIMENSION_DRAFT), frameWidthMm: digitsOnly },
																}))
															}}
														/>
														<input
															className={`${styles.dimensionInput} ${dimensionValidationByType[boxType].frameHeightInvalid ? styles.dimensionInputInvalid : ''}`}
															type="number"
															min={0}
															step={1}
															inputMode="numeric"
															value={draft.frameHeightMm}
															disabled={isReadOnly}
															onInput={(event: any) => {
																const digitsOnly = String(event.target.value || '').replace(/[^\d]/g, '')
																setBoxSpecDimensionDraftByType((prev) => ({
																	...prev,
																	[boxType]: { ...(prev[boxType] || EMPTY_DIMENSION_DRAFT), frameHeightMm: digitsOnly },
																}))
															}}
														/>
														<div className={styles.dimensionNotApplicable}>-</div>
												</div> : null}
											</div>
										</div>
									)
								})}
							</div>
						</div>
						</div> : null}
				</VisualForm>
			</div>
		</PagePaddedCentered>
	)
}
