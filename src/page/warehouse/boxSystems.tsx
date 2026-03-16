import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { gql, useMutation, useQuery } from '@/api'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import Modal from '@/shared/modal'
import T from '@/shared/translate'
import hiveSystemsImageURL from '@/assets/hive-systems.webp'
import styles from './style.module.less'

type BoxSystem = {
	id: string
	name: string
	isDefault: boolean
}

const BOX_SYSTEMS_QUERY = gql`
{
	boxSystems {
		id
		name
		isDefault
	}
	apiaries {
		id
		hives {
			id
			boxSystemId
			hiveNumber
		}
	}
}
`

const CREATE_BOX_SYSTEM_MUTATION = gql`
mutation createBoxSystem($name: String!) {
	createBoxSystem(name: $name) {
		id
		name
		isDefault
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

const DEACTIVATE_BOX_SYSTEM_MUTATION = gql`
mutation deactivateBoxSystem($id: ID!, $replacementSystemId: ID) {
	deactivateBoxSystem(id: $id, replacementSystemId: $replacementSystemId)
}
`

const SYSTEM_COLOR_PALETTE = [
	{ accent: '#2f80ed', soft: '#eaf2ff', border: '#a8c7f7' },
	{ accent: '#f2994a', soft: '#fff2e8', border: '#f5c59a' },
	{ accent: '#27ae60', soft: '#e9f8ef', border: '#9ad8b3' },
	{ accent: '#eb5757', soft: '#ffecec', border: '#f1a7a7' },
]

function getSystemPaletteByIndex(index = 0) {
	return SYSTEM_COLOR_PALETTE[index % SYSTEM_COLOR_PALETTE.length]
}

function getSystemThemeStyle(fallbackIndex = 0) {
	const c = getSystemPaletteByIndex(fallbackIndex)
	return {
		['--system-accent' as any]: c.accent,
		['--system-soft' as any]: c.soft,
		['--item-color' as any]: c.accent,
		['--item-border' as any]: c.border,
	}
}

export default function WarehouseBoxSystemsPage() {
	const [newSystemName, setNewSystemName] = useState('')
	const [renameInputs, setRenameInputs] = useState<Record<string, string>>({})
	const [editingSystemId, setEditingSystemId] = useState<string | null>(null)
	const [archiveSystemId, setArchiveSystemId] = useState<string | null>(null)
	const [archiveReplacementSystemId, setArchiveReplacementSystemId] = useState<string>('')
	const [archiveValidationError, setArchiveValidationError] = useState<string | null>(null)
	const { data, loading, error, reexecuteQuery } = useQuery(BOX_SYSTEMS_QUERY)
	const [createBoxSystem, { error: createSystemError }] = useMutation(CREATE_BOX_SYSTEM_MUTATION)
	const [renameBoxSystem, { error: renameSystemError }] = useMutation(RENAME_BOX_SYSTEM_MUTATION)
	const [deactivateBoxSystem, { error: deactivateSystemError }] = useMutation(DEACTIVATE_BOX_SYSTEM_MUTATION)

	const boxSystems: BoxSystem[] = useMemo(() => data?.boxSystems || [], [data?.boxSystems])
	const hasOnlyDefaultSystem = boxSystems.length === 1 && !!boxSystems[0]?.isDefault
	const activeHiveCountBySystemId = useMemo(() => {
		const counts: Record<string, number> = {}
		for (const apiary of data?.apiaries || []) {
			for (const hive of apiary?.hives || []) {
				const sid = hive?.boxSystemId ? String(hive.boxSystemId) : ''
				if (!sid) continue
				counts[sid] = (counts[sid] || 0) + 1
			}
		}
		return counts
	}, [data?.apiaries])
	const archivingSystem = useMemo(
		() => boxSystems.find((system: BoxSystem) => system.id === archiveSystemId) || null,
		[boxSystems, archiveSystemId]
	)
	const replacementCandidates = useMemo(() => {
		return boxSystems.filter((system: BoxSystem) => system.id !== archiveSystemId)
	}, [boxSystems, archiveSystemId])
	const hivesUsingArchivingSystem = archiveSystemId ? (activeHiveCountBySystemId[archiveSystemId] || 0) : 0

	useEffect(() => {
		setRenameInputs(
			(boxSystems || []).reduce((acc: Record<string, string>, system: BoxSystem) => {
				acc[system.id] = system.name
				return acc
			}, {})
		)
	}, [boxSystems])

	async function onCreateSystem(event: any) {
		event.preventDefault()
		const trimmed = newSystemName.trim()
		if (!trimmed) return
		await createBoxSystem({ name: trimmed })
		await reexecuteQuery({ requestPolicy: 'network-only' })
		setNewSystemName('')
	}

	async function onRenameSystem(id: string) {
		const name = (renameInputs[id] || '').trim()
		if (!name) return
		await renameBoxSystem({ id, name })
		await reexecuteQuery({ requestPolicy: 'network-only' })
		setEditingSystemId(null)
	}

	async function onDeactivateSystem(id: string) {
		const activeHivesUsingSystem = activeHiveCountBySystemId[id] || 0
		if (activeHivesUsingSystem === 0) {
			const directResult = await deactivateBoxSystem({ id, replacementSystemId: undefined })
			if (directResult?.error) return
			await reexecuteQuery({ requestPolicy: 'network-only' })
			return
		}

		const defaultReplacement =
			boxSystems.find((system: BoxSystem) => system.id !== id && system.isDefault)
			|| boxSystems.find((system: BoxSystem) => system.id !== id)
			|| null
		setArchiveSystemId(id)
		setArchiveReplacementSystemId(defaultReplacement?.id || '')
		setArchiveValidationError(null)
	}

	function closeArchiveModal() {
		setArchiveSystemId(null)
		setArchiveReplacementSystemId('')
		setArchiveValidationError(null)
	}

	async function onConfirmDeactivateSystem() {
		if (!archiveSystemId) return
		if (hivesUsingArchivingSystem > 0 && !archiveReplacementSystemId) {
			setArchiveValidationError('Please select a replacement hive system.')
			return
		}
		const replacementSystemId = archiveReplacementSystemId || undefined
		const result = await deactivateBoxSystem({ id: archiveSystemId, replacementSystemId })
		if (result?.error) return
		closeArchiveModal()
		await reexecuteQuery({ requestPolicy: 'network-only' })
	}

	if (loading && !data?.boxSystems) return <Loader />

	return (
		<div className={styles.page}>
			<Link to="/warehouse" className={styles.backLink}><T>Back to warehouse</T></Link>
			<h2><T>Hive systems</T></h2>
			<p className={styles.description}>
				<T>Manage available hive systems used in warehouse and hive workflows.</T>
			</p>
			<ErrorMsg error={error || createSystemError || renameSystemError || deactivateSystemError} />

			<section className={styles.detailCard}>
					<form onSubmit={onCreateSystem} className={styles.systemCreateForm}>
						<input
							className={`${styles.textInput} ${styles.systemNameInput}`}
							type="text"
							placeholder="Examples: National, Warre, Dadant"
							value={newSystemName}
							onInput={(event: any) => setNewSystemName(event.target.value)}
						/>
					<Button type="submit" color="green" disabled={!newSystemName.trim()}>
						<T>Create system</T>
					</Button>
				</form>

				<div className={styles.systemList}>
					{boxSystems.map((system: BoxSystem, systemIndex: number) => (
						<div key={system.id} className={styles.systemRow} style={getSystemThemeStyle(systemIndex)}>
							<div className={styles.systemRowMain}>
								<span className={styles.systemColorDot} aria-hidden="true"></span>
									<div className={styles.itemTitleRow}>
										<span className={styles.itemTitle}>{system.name}</span>
										{system.isDefault ? <span className={styles.defaultBadge}><T>Default</T></span> : null}
										<span className={styles.usageBadge}>
											{activeHiveCountBySystemId[system.id] || 0} <T>hives in use</T>
										</span>
									</div>
								</div>
							<div className={styles.systemRowActions}>
								{editingSystemId === system.id ? (
									<div className={styles.systemRenameRow}>
										<input
											className={styles.textInput}
											type="text"
											value={renameInputs[system.id] || ''}
											onInput={(event: any) =>
												setRenameInputs((prev) => ({ ...prev, [system.id]: event.target.value }))
											}
											onKeyDown={(event: any) => {
												if (event.key === 'Enter') {
													event.preventDefault()
													onRenameSystem(system.id)
												}
												if (event.key === 'Escape') {
													setEditingSystemId(null)
												}
											}}
											autoFocus
										/>
										<Button size="small" onClick={() => onRenameSystem(system.id)}>
											<T>Save</T>
										</Button>
										<Button size="small" color="white" onClick={() => setEditingSystemId(null)}>
											<T>Cancel</T>
										</Button>
									</div>
								) : (
									<div className={styles.controls}>
										<Button size="small" onClick={() => setEditingSystemId(system.id)}>
											<T>Rename</T>
										</Button>
										<Button size="small" color="white" disabled={!!system.isDefault} onClick={() => onDeactivateSystem(system.id)}>
											<T>Archive</T>
										</Button>
									</div>
								)}
							</div>
						</div>
					))}
				</div>

				{hasOnlyDefaultSystem ? (
					<>
						<img src={hiveSystemsImageURL} alt="Single hive system placeholder" className={styles.singleSystemPlaceholderImage} draggable={false} />
						<p className={styles.singleSystemPlaceholderText}>
							<T>It's lucky that you have only one system for now.</T>
						</p>
					</>
				) : null}
			</section>
			{archiveSystemId && archivingSystem ? (
				<Modal title={<T>Archive Hive System</T>} onClose={closeArchiveModal}>
					<div className={styles.archiveModalContent}>
						<p className={styles.archiveModalCopy}>
							<T>Are you sure you want to archive this hive system?</T>{' '}
							<strong>{archivingSystem.name}</strong>
						</p>
						<p className={styles.archiveModalCopy}>
							<T>Active hives currently using this system</T>: <strong>{hivesUsingArchivingSystem}</strong>
						</p>
						<label className={styles.archiveLabel} htmlFor="archive-replacement-system">
							<T>Replacement hive system for affected active hives</T>
						</label>
						<select
							id="archive-replacement-system"
							className={styles.textInput}
							value={archiveReplacementSystemId}
							onInput={(event: any) => {
								setArchiveValidationError(null)
								setArchiveReplacementSystemId(event.target.value)
							}}
						>
							<option value=""><T>Select replacement system</T></option>
							{replacementCandidates.map((system: BoxSystem) => (
								<option key={system.id} value={system.id}>
									{system.name}{system.isDefault ? ' (Default)' : ''}
								</option>
							))}
						</select>
						{archiveValidationError ? <p className={styles.archiveError}>{archiveValidationError}</p> : null}
						<div className={styles.archiveActions}>
							<Button color="white" onClick={closeArchiveModal}>
								<T>Cancel</T>
							</Button>
							<Button
								color="green"
								disabled={hivesUsingArchivingSystem > 0 && !archiveReplacementSystemId}
								onClick={onConfirmDeactivateSystem}
							>
								<T>Archive and reassign</T>
							</Button>
						</div>
					</div>
				</Modal>
			) : null}
		</div>
	)
}
