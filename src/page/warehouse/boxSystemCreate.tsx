import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { gql, useMutation, useQuery } from '@/api'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import PagePaddedCentered from '@/shared/pagePaddedCentered'
import T, { useTranslation } from '@/shared/translate'
import VisualForm from '@/shared/visualForm'
import {
	applyFrameSourceToAllBoxTypes,
	FRAME_BOX_TYPE_ORDER,
} from './boxSystemProfiles'
import styles from './style.module.less'

type BoxSystem = {
	id: string
	name: string
	isDefault: boolean
}

type EditableBoxType = 'DEEP' | 'SUPER'

type BoxSpecDimensionDraft = {
	internalWidthMm: string
	internalLengthMm: string
	internalHeightMm: string
	externalWidthMm: string
	externalLengthMm: string
	frameWidthMm: string
	frameHeightMm: string
}

type HiveSystemTemplate = {
	name: string
	aliases?: string[]
	description: string
	dimensionsByType: Record<EditableBoxType, BoxSpecDimensionDraft>
}

const EDITABLE_BOX_TYPES: EditableBoxType[] = ['DEEP', 'SUPER']

const INITIAL_DIMENSIONS_BY_TYPE: Record<EditableBoxType, BoxSpecDimensionDraft> = {
	DEEP: {
		internalWidthMm: '',
		internalLengthMm: '',
		internalHeightMm: '',
		externalWidthMm: '',
		externalLengthMm: '',
		frameWidthMm: '',
		frameHeightMm: '',
	},
	SUPER: {
		internalWidthMm: '',
		internalLengthMm: '',
		internalHeightMm: '',
		externalWidthMm: '',
		externalLengthMm: '',
		frameWidthMm: '',
		frameHeightMm: '',
	},
}

// WHY: creation should work without another API round-trip; these public hive templates
// prefill reference dimensions while still allowing users to override every value.
const HIVE_SYSTEM_TEMPLATES: HiveSystemTemplate[] = [
	{
		name: 'Langstroth',
		description: 'Deep frame 448×232 mm, super frame 448×159 mm; prefilled values are editable',
		dimensionsByType: {
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
		},
	},
	{
		name: 'National',
		aliases: ['British National'],
		description: 'British National: brood frame 356×216 mm, super frame 356×140 mm; editable',
		dimensionsByType: {
			DEEP: {
				internalWidthMm: '460',
				internalLengthMm: '460',
				internalHeightMm: '225',
				externalWidthMm: '',
				externalLengthMm: '',
				frameWidthMm: '356',
				frameHeightMm: '216',
			},
			SUPER: {
				internalWidthMm: '460',
				internalLengthMm: '460',
				internalHeightMm: '150',
				externalWidthMm: '',
				externalLengthMm: '',
				frameWidthMm: '356',
				frameHeightMm: '140',
			},
		},
	},
	{
		name: 'Dadant-Blatt',
		aliases: ['Dadant'],
		description: 'Dadant-Blatt: brood frame 435×300 mm, super frame 435×160 mm; editable',
		dimensionsByType: {
			DEEP: {
				internalWidthMm: '450',
				internalLengthMm: '450',
				internalHeightMm: '310',
				externalWidthMm: '',
				externalLengthMm: '',
				frameWidthMm: '435',
				frameHeightMm: '300',
			},
			SUPER: {
				internalWidthMm: '450',
				internalLengthMm: '450',
				internalHeightMm: '170',
				externalWidthMm: '',
				externalLengthMm: '',
				frameWidthMm: '435',
				frameHeightMm: '160',
			},
		},
	},
	{
		name: 'Warré',
		aliases: ['Warre'],
		description: 'Warré: frame/top-bar reference 300×210 mm',
		dimensionsByType: {
			DEEP: {
				internalWidthMm: '300',
				internalLengthMm: '300',
				internalHeightMm: '210',
				externalWidthMm: '',
				externalLengthMm: '',
				frameWidthMm: '300',
				frameHeightMm: '210',
			},
			SUPER: {
				internalWidthMm: '300',
				internalLengthMm: '300',
				internalHeightMm: '210',
				externalWidthMm: '',
				externalLengthMm: '',
				frameWidthMm: '300',
				frameHeightMm: '210',
			},
		},
	},
]

function normalizeTemplateName(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
}

function findHiveSystemTemplate(value: string): HiveSystemTemplate | undefined {
	const normalized = normalizeTemplateName(value)
	if (!normalized) return undefined
	return HIVE_SYSTEM_TEMPLATES.find((template) => {
		const names = [template.name, ...(template.aliases || [])]
		return names.some((candidate) => normalizeTemplateName(candidate) === normalized)
	})
}

function cloneTemplateDimensions(template: HiveSystemTemplate): Record<EditableBoxType, BoxSpecDimensionDraft> {
	return {
		DEEP: { ...template.dimensionsByType.DEEP },
		SUPER: { ...template.dimensionsByType.SUPER },
	}
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

const CREATE_BOX_SYSTEM_MUTATION = gql`
mutation createBoxSystem($name: String!) {
	createBoxSystem(name: $name) {
		id
		name
		isDefault
	}
}
`

const BOX_SYSTEMS_QUERY = gql`
query boxSystemCreateContext {
	boxSystems {
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

export default function WarehouseBoxSystemCreatePage() {
	const navigate = useNavigate()
	const [name, setName] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [useOwnBoxProfile, setUseOwnBoxProfile] = useState(true)
	const [boxSourceSystemId, setBoxSourceSystemId] = useState('')
	const [useOwnFrameProfile, setUseOwnFrameProfile] = useState(true)
	const [frameSourceSystemId, setFrameSourceSystemId] = useState('')
	const [formError, setFormError] = useState<any>(null)
	const [boxSpecDimensionDraftByType, setBoxSpecDimensionDraftByType] = useState<Record<EditableBoxType, BoxSpecDimensionDraft>>(
		INITIAL_DIMENSIONS_BY_TYPE
	)

	const { data, loading, error } = useQuery(BOX_SYSTEMS_QUERY)
	const [createBoxSystem, { error: createError }] = useMutation(CREATE_BOX_SYSTEM_MUTATION)
	const [setBoxSystemBoxProfileSource, { error: setBoxProfileError }] = useMutation(SET_BOX_SYSTEM_BOX_PROFILE_SOURCE_MUTATION)
	const [setBoxSystemFrameSource, { error: setFrameSourceError }] = useMutation(SET_BOX_SYSTEM_FRAME_SOURCE_MUTATION)
	const [setBoxSpecDimensions, { error: setBoxSpecDimensionsError }] = useMutation(SET_BOX_SPEC_DIMENSIONS_MUTATION)

	const sourceSystems: BoxSystem[] = useMemo(() => data?.boxSystems || [], [data?.boxSystems])
	const defaultSourceSystemId = sourceSystems[0]?.id || ''
	const selectedTemplate = useMemo(() => findHiveSystemTemplate(name), [name])
	const showSectionDimensionRows = useOwnBoxProfile
	const namePlaceholder = useTranslation('Select a template or type a custom hive system name')
	const showFrameDimensionRows = useOwnFrameProfile
	const showReferenceDimensions = showSectionDimensionRows || showFrameDimensionRows
	const dimensionValidationByType = useMemo(() => {
		return EDITABLE_BOX_TYPES.reduce<Record<EditableBoxType, {
			frameWidthInvalid: boolean
			frameHeightInvalid: boolean
			externalWidthInvalid: boolean
			externalLengthInvalid: boolean
		}>>((acc, boxType) => {
			const draft = boxSpecDimensionDraftByType[boxType]
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

	async function onSubmit(event: any) {
		event.preventDefault()
		setFormError(null)
		const trimmed = name.trim()
		if (!trimmed) return
		for (const boxType of EDITABLE_BOX_TYPES) {
			const draft = boxSpecDimensionDraftByType[boxType]
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
		setSubmitting(true)
		try {
			const result = await createBoxSystem({ name: trimmed })
			const createdId = String(result?.data?.createBoxSystem?.id || '')
			if (!createdId) return

			const selectedBoxSource = boxSourceSystemId || defaultSourceSystemId
			const selectedFrameSource = useOwnFrameProfile
				? createdId
				: (frameSourceSystemId || defaultSourceSystemId)

			if (!useOwnBoxProfile && selectedBoxSource) {
				await setBoxSystemBoxProfileSource({
					systemId: createdId,
					boxSourceSystemId: selectedBoxSource,
				})
			}

			if (selectedFrameSource) {
				await applyFrameSourceToAllBoxTypes(setBoxSystemFrameSource, createdId, selectedFrameSource)
			}

			if (showReferenceDimensions) {
				for (const boxType of EDITABLE_BOX_TYPES) {
					const draft = boxSpecDimensionDraftByType[boxType]
					await setBoxSpecDimensions({
						systemId: createdId,
						boxType,
						internalWidthMm: showSectionDimensionRows ? fromDraftValue(draft.internalWidthMm) : null,
						internalLengthMm: showSectionDimensionRows ? fromDraftValue(draft.internalLengthMm) : null,
						internalHeightMm: showSectionDimensionRows ? fromDraftValue(draft.internalHeightMm) : null,
						externalWidthMm: showSectionDimensionRows ? fromDraftValue(draft.externalWidthMm) : null,
						externalLengthMm: showSectionDimensionRows ? fromDraftValue(draft.externalLengthMm) : null,
						frameWidthMm: showFrameDimensionRows ? fromDraftValue(draft.frameWidthMm) : null,
						frameHeightMm: showFrameDimensionRows ? fromDraftValue(draft.frameHeightMm) : null,
					})
				}
			}

			navigate('/warehouse/box-systems', { replace: true })
		} finally {
			setSubmitting(false)
		}
	}

	if (loading && !data?.boxSystems) return <Loader />

	return (
		<PagePaddedCentered>
			<h1><T>Create hive system</T></h1>
			<ErrorMsg error={formError || error || createError || setBoxProfileError || setFrameSourceError || setBoxSpecDimensionsError} />
			<div className={styles.formContainer}>
				<VisualForm
					onSubmit={onSubmit}
					submit={
						<div className={styles.actions}>
							<Button type="button" onClick={() => navigate('/warehouse/box-systems', { replace: true })}>
								<T>Cancel</T>
							</Button>
							<Button type="submit" color="green" loading={submitting} disabled={!name.trim()}>
								<T>Create</T>
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
								list="hive-system-template-options"
								placeholder={namePlaceholder}
								value={name}
								onInput={(event: any) => {
									const nextName = String(event.target.value || '')
									setName(nextName)

									const template = findHiveSystemTemplate(nextName)
									if (template) {
										setBoxSpecDimensionDraftByType(cloneTemplateDimensions(template))
										setUseOwnBoxProfile(true)
										setUseOwnFrameProfile(true)
									}
								}}
								autoFocus
							/>
							<datalist id="hive-system-template-options">
								{HIVE_SYSTEM_TEMPLATES.map((template) => (
									<option key={template.name} value={template.name}>{template.description}</option>
								))}
							</datalist>
							<div className={styles.templateHint}>
								{selectedTemplate ? selectedTemplate.description : <T>Pick an existing hive system template to prefill reference dimensions.</T>}
							</div>
						</div>
					</div>

					<div className={styles.formField}>
						<label className={styles.formLabel}><T>Section sizes profile</T></label>
						<div className={styles.fieldControl}>
							<label className={styles.switchRow}>
								<input
									className={styles.switchInput}
									type="checkbox"
									checked={useOwnBoxProfile}
									onChange={(event: any) => {
										const own = !!event.target.checked
										setUseOwnBoxProfile(own)
										if (!own && !boxSourceSystemId && sourceSystems.length) {
											setBoxSourceSystemId(sourceSystems[0].id)
										}
									}}
								/>
								<span className={styles.switchTrack} aria-hidden="true">
									<span className={styles.switchThumb}></span>
								</span>
								<span className={styles.switchLabel}>
									{useOwnBoxProfile ? <T>Use own section sizes</T> : <T>Use existing section size system</T>}
								</span>
							</label>
							{!useOwnBoxProfile ? (
								<div className={styles.radioGroup}>
									{sourceSystems.map((candidate: BoxSystem) => (
										<label
											key={`box-source-${candidate.id}`}
											className={`${styles.radioOption} ${boxSourceSystemId === candidate.id ? styles.radioOptionActive : ''}`}
										>
											<input
												className={styles.radioInput}
												type="radio"
												name="box-profile-source-system"
												value={candidate.id}
												checked={boxSourceSystemId === candidate.id}
												onChange={(event: any) => setBoxSourceSystemId(event.target.value)}
											/>
											<span className={styles.radioMark} aria-hidden="true"></span>
											<span className={styles.radioText}>{candidate.name}</span>
										</label>
									))}
								</div>
							) : null}
						</div>
					</div>

					<div className={styles.formField}>
						<label className={styles.formLabel}><T>Frame profile</T></label>
						<div className={styles.fieldControl}>
							<label className={styles.switchRow}>
								<input
									className={styles.switchInput}
									type="checkbox"
									checked={useOwnFrameProfile}
									onChange={(event: any) => {
										const own = !!event.target.checked
										setUseOwnFrameProfile(own)
										if (!own && !frameSourceSystemId && sourceSystems.length) {
											setFrameSourceSystemId(sourceSystems[0].id)
										}
									}}
								/>
								<span className={styles.switchTrack} aria-hidden="true">
									<span className={styles.switchThumb}></span>
								</span>
								<span className={styles.switchLabel}>
									{useOwnFrameProfile ? <T>Use own frame profile</T> : <T>Use existing frame size system</T>}
								</span>
							</label>
							{!useOwnFrameProfile ? (
								<div className={styles.radioGroup}>
									{sourceSystems.map((candidate: BoxSystem) => (
										<label
											key={`frame-source-${candidate.id}`}
											className={`${styles.radioOption} ${frameSourceSystemId === candidate.id ? styles.radioOptionActive : ''}`}
										>
											<input
												className={styles.radioInput}
												type="radio"
												name="frame-profile-source-system"
												value={candidate.id}
												checked={frameSourceSystemId === candidate.id}
												onChange={(event: any) => setFrameSourceSystemId(event.target.value)}
											/>
											<span className={styles.radioMark} aria-hidden="true"></span>
											<span className={styles.radioText}>{candidate.name}</span>
										</label>
									))}
								</div>
							) : null}
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
									const draft = boxSpecDimensionDraftByType[boxType]
									const sectionTitle = boxType === 'DEEP' ? 'Deep' : 'Super'
									return (
										<div key={`create-dim-${boxType}`} className={styles.dimensionTypeSection}>
											<div className={styles.dimensionTypeTitle}><T>{sectionTitle}</T></div>
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
														onInput={(event: any) => {
															const digitsOnly = String(event.target.value || '').replace(/[^\d]/g, '')
															setBoxSpecDimensionDraftByType((prev) => ({
																...prev,
																[boxType]: { ...prev[boxType], internalWidthMm: digitsOnly },
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
														onInput={(event: any) => {
															const digitsOnly = String(event.target.value || '').replace(/[^\d]/g, '')
															setBoxSpecDimensionDraftByType((prev) => ({
																...prev,
																[boxType]: { ...prev[boxType], internalHeightMm: digitsOnly },
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
														onInput={(event: any) => {
															const digitsOnly = String(event.target.value || '').replace(/[^\d]/g, '')
															setBoxSpecDimensionDraftByType((prev) => ({
																...prev,
																[boxType]: { ...prev[boxType], internalLengthMm: digitsOnly },
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
														onInput={(event: any) => {
															const digitsOnly = String(event.target.value || '').replace(/[^\d]/g, '')
															setBoxSpecDimensionDraftByType((prev) => ({
																...prev,
																[boxType]: { ...prev[boxType], externalWidthMm: digitsOnly },
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
														onInput={(event: any) => {
															const digitsOnly = String(event.target.value || '').replace(/[^\d]/g, '')
															setBoxSpecDimensionDraftByType((prev) => ({
																...prev,
																[boxType]: { ...prev[boxType], externalLengthMm: digitsOnly },
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
														onInput={(event: any) => {
															const digitsOnly = String(event.target.value || '').replace(/[^\d]/g, '')
															setBoxSpecDimensionDraftByType((prev) => ({
																...prev,
																[boxType]: { ...prev[boxType], frameWidthMm: digitsOnly },
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
														onInput={(event: any) => {
															const digitsOnly = String(event.target.value || '').replace(/[^\d]/g, '')
															setBoxSpecDimensionDraftByType((prev) => ({
																...prev,
																[boxType]: { ...prev[boxType], frameHeightMm: digitsOnly },
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
