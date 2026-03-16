import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { gql, useMutation, useQuery } from '@/api'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import PagePaddedCentered from '@/shared/pagePaddedCentered'
import T from '@/shared/translate'
import VisualForm from '@/shared/visualForm'
import styles from './style.module.less'

type BoxSystem = {
	id: string
	name: string
	isDefault: boolean
	boxProfileSourceSystemId?: string | null
}

type BoxSystemFrameSetting = {
	systemId: string
	boxType: 'DEEP' | 'SUPER' | 'LARGE_HORIZONTAL_SECTION'
	frameSourceSystemId?: string | null
}

const BOX_SYSTEM_EDIT_QUERY = gql`
query boxSystemEditQuery {
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

const FRAME_BOX_TYPE_ORDER: Array<BoxSystemFrameSetting['boxType']> = ['DEEP', 'SUPER', 'LARGE_HORIZONTAL_SECTION']

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
	const [formError, setFormError] = useState<string | null>(null)

	const { data, loading, error, reexecuteQuery } = useQuery(BOX_SYSTEM_EDIT_QUERY)
	const [renameBoxSystem, { error: renameError }] = useMutation(RENAME_BOX_SYSTEM_MUTATION)
	const [setBoxSystemBoxProfileSource, { error: setBoxProfileError }] = useMutation(SET_BOX_SYSTEM_BOX_PROFILE_SOURCE_MUTATION)
	const [setBoxSystemFrameSource, { error: setFrameSourceError }] = useMutation(SET_BOX_SYSTEM_FRAME_SOURCE_MUTATION)

	const boxSystems: BoxSystem[] = useMemo(() => data?.boxSystems || [], [data?.boxSystems])
	const frameSettings: BoxSystemFrameSetting[] = useMemo(() => data?.boxSystemFrameSettings || [], [data?.boxSystemFrameSettings])
	const system = useMemo(() => boxSystems.find((item: BoxSystem) => item.id === systemId) || null, [boxSystems, systemId])
	const frameSettingBySystemAndType = useMemo(() => {
		return (frameSettings || []).reduce((acc: Record<string, BoxSystemFrameSetting>, setting: BoxSystemFrameSetting) => {
			acc[`${setting.systemId}:${setting.boxType}`] = setting
			return acc
		}, {})
	}, [frameSettings])

	function getCurrentFrameProfileSource(targetSystemId: string): string {
		const sources = FRAME_BOX_TYPE_ORDER
			.map((boxType) => frameSettingBySystemAndType[`${targetSystemId}:${boxType}`])
			.filter(Boolean)
			.map((setting) => String(setting!.frameSourceSystemId || targetSystemId))

		if (!sources.length) return targetSystemId
		const unique = Array.from(new Set(sources))
		if (unique.length === 1) return unique[0]
		return '__MIXED__'
	}

	const currentFrameSource = system ? getCurrentFrameProfileSource(system.id) : ''
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
	const hasExplicitOwnFrameMapping = !!system && FRAME_BOX_TYPE_ORDER.every((boxType) => {
		const setting = frameSettingBySystemAndType[`${system.id}:${boxType}`]
		return String(setting?.frameSourceSystemId || '') === system.id
	})
	const hasFrameProfileChanged = draftUseOwnFrameProfile
		? !!system && (currentFrameSource !== system.id || !hasExplicitOwnFrameMapping)
		: !!resolvedDraftFrameSourceSystemId && resolvedDraftFrameSourceSystemId !== currentFrameSource
	const hasUnsavedChanges = hasNameChanged || hasBoxProfileChanged || hasFrameProfileChanged
	const isSaveDisabled = !system || system.isDefault || isSaving || !trimmedNameInput || !hasUnsavedChanges

	useEffect(() => {
		if (!system) return
		setNameInput(system.name)
		setFormError(null)
		setDraftUseOwnBoxProfile(!system.boxProfileSourceSystemId)
		setDraftBoxSourceSystemId(system.boxProfileSourceSystemId ? String(system.boxProfileSourceSystemId) : '')
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
			setFormError('Name is required.')
			return
		}
		if (!hasUnsavedChanges) return

		if (!draftUseOwnFrameProfile && !resolvedDraftFrameSourceSystemId && currentFrameSource === system.id) {
			setFormError('Please choose an existing frame size system.')
			return
		}

		setIsSaving(true)
		try {
			if (hasNameChanged) {
				await renameBoxSystem({ id: system.id, name: trimmed })
			}

			if (hasBoxProfileChanged) {
				await setBoxSystemBoxProfileSource({
					systemId: system.id,
					boxSourceSystemId: nextBoxProfileSource || null,
				})
			}

			if (hasFrameProfileChanged && resolvedDraftFrameSourceSystemId) {
				for (const boxType of FRAME_BOX_TYPE_ORDER) {
					await setBoxSystemFrameSource({
						systemId: system.id,
						boxType,
						frameSourceSystemId: resolvedDraftFrameSourceSystemId,
					})
				}
			}

			await reexecuteQuery({ requestPolicy: 'network-only' })
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<PagePaddedCentered>
			<h2><T>Edit hive system</T></h2>
			<ErrorMsg error={formError || error || renameError || setBoxProfileError || setFrameSourceError} />
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
								disabled={system.isDefault || isSaving}
							/>
						</div>
					</div>

					<div className={styles.formField}>
						<label className={styles.formLabel}><T>Box sizes profile</T></label>
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
									{draftUseOwnBoxProfile ? <T>Use own box sizes</T> : <T>Use existing box size system</T>}
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
				</VisualForm>
			</div>
		</PagePaddedCentered>
	)
}
