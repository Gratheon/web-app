import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { gql, useMutation, useQuery } from '@/api'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import PagePaddedCentered from '@/shared/pagePaddedCentered'
import T from '@/shared/translate'
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

export default function WarehouseBoxSystemCreatePage() {
	const navigate = useNavigate()
	const [name, setName] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [useOwnBoxProfile, setUseOwnBoxProfile] = useState(true)
	const [boxSourceSystemId, setBoxSourceSystemId] = useState('')
	const [useOwnFrameProfile, setUseOwnFrameProfile] = useState(true)
	const [frameSourceSystemId, setFrameSourceSystemId] = useState('')

	const { data, loading, error } = useQuery(BOX_SYSTEMS_QUERY)
	const [createBoxSystem, { error: createError }] = useMutation(CREATE_BOX_SYSTEM_MUTATION)
	const [setBoxSystemBoxProfileSource, { error: setBoxProfileError }] = useMutation(SET_BOX_SYSTEM_BOX_PROFILE_SOURCE_MUTATION)
	const [setBoxSystemFrameSource, { error: setFrameSourceError }] = useMutation(SET_BOX_SYSTEM_FRAME_SOURCE_MUTATION)

	const sourceSystems: BoxSystem[] = useMemo(() => data?.boxSystems || [], [data?.boxSystems])
	const defaultSourceSystemId = sourceSystems[0]?.id || ''

	async function onSubmit(event: any) {
		event.preventDefault()
		const trimmed = name.trim()
		if (!trimmed) return
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

			navigate('/warehouse/box-systems', { replace: true })
		} finally {
			setSubmitting(false)
		}
	}

	if (loading && !data?.boxSystems) return <Loader />

	return (
		<PagePaddedCentered>
			<h1><T>Create hive system</T></h1>
			<ErrorMsg error={error || createError || setBoxProfileError || setFrameSourceError} />
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
								placeholder="Examples: National, Warre, Dadant"
								value={name}
								onInput={(event: any) => setName(event.target.value)}
								autoFocus
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
				</VisualForm>
			</div>
		</PagePaddedCentered>
	)
}
