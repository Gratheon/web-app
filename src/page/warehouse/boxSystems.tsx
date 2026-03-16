import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { gql, useMutation, useQuery } from '@/api'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import Modal from '@/shared/modal'
import T from '@/shared/translate'
import hiveSystemsImageURL from '@/assets/hive-systems.webp'
import {
	buildActiveHiveCountBySystemId,
	pickDefaultReplacementSystem,
} from './boxSystems.helpers'
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
	const navigate = useNavigate()
	const [archiveSystemId, setArchiveSystemId] = useState<string | null>(null)
	const [archiveReplacementSystemId, setArchiveReplacementSystemId] = useState<string>('')
	const [archiveValidationError, setArchiveValidationError] = useState<string | null>(null)
	const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null)
	const { data, loading, error, reexecuteQuery } = useQuery(BOX_SYSTEMS_QUERY)
	const [deactivateBoxSystem, { error: deactivateSystemError }] = useMutation(DEACTIVATE_BOX_SYSTEM_MUTATION)

	const boxSystems: BoxSystem[] = useMemo(() => data?.boxSystems || [], [data?.boxSystems])
	const hasOnlyDefaultSystem = boxSystems.length === 1 && !!boxSystems[0]?.isDefault
	const activeHiveCountBySystemId = useMemo(() => buildActiveHiveCountBySystemId(data?.apiaries || []), [data?.apiaries])
	const archivingSystem = useMemo(
		() => boxSystems.find((system: BoxSystem) => system.id === archiveSystemId) || null,
		[boxSystems, archiveSystemId]
	)
	const replacementCandidates = useMemo(() => {
		return boxSystems.filter((system: BoxSystem) => system.id !== archiveSystemId)
	}, [boxSystems, archiveSystemId])
	const hivesUsingArchivingSystem = archiveSystemId ? (activeHiveCountBySystemId[archiveSystemId] || 0) : 0

	useEffect(() => {
		if (boxSystems.length === 0) {
			setSelectedSystemId(null)
			return
		}

		if (!selectedSystemId || !boxSystems.some((system: BoxSystem) => system.id === selectedSystemId)) {
			setSelectedSystemId(boxSystems[0].id)
		}
	}, [boxSystems, selectedSystemId])

	async function onDeactivateSystem(id: string) {
		const activeHivesUsingSystem = activeHiveCountBySystemId[id] || 0
		if (activeHivesUsingSystem === 0) {
			const directResult = await deactivateBoxSystem({ id, replacementSystemId: undefined })
			if (directResult?.error) return
			await reexecuteQuery({ requestPolicy: 'network-only' })
			return
		}

		const defaultReplacement = pickDefaultReplacementSystem(boxSystems, id)
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

	useEffect(() => {
		const isTypingTarget = (target: EventTarget | null) => {
			if (!target || !(target instanceof HTMLElement)) return false
			const tagName = String(target.tagName || '').toLowerCase()
			return (
				target.isContentEditable ||
				tagName === 'input' ||
				tagName === 'textarea' ||
				tagName === 'select'
			)
		}

		const onKeyDown = async (event: KeyboardEvent) => {
			if (isTypingTarget(event.target)) {
				return
			}

			if (archiveSystemId) {
				if (event.key === 'Escape') {
					event.preventDefault()
					event.stopPropagation()
					closeArchiveModal()
					return
				}

				if (event.key === 'Enter') {
					event.preventDefault()
					event.stopPropagation()
					await onConfirmDeactivateSystem()
				}
				return
			}

			if (!boxSystems.length) return

			if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
				event.preventDefault()
				event.stopPropagation()

				const currentIndex = boxSystems.findIndex((system: BoxSystem) => system.id === selectedSystemId)
				if (currentIndex === -1) {
					setSelectedSystemId(
						event.key === 'ArrowUp'
							? boxSystems[boxSystems.length - 1].id
							: boxSystems[0].id
					)
					return
				}

				const nextIndex = event.key === 'ArrowUp'
					? Math.max(0, currentIndex - 1)
					: Math.min(boxSystems.length - 1, currentIndex + 1)
				setSelectedSystemId(boxSystems[nextIndex].id)
				return
			}

			if (event.key === 'Enter') {
				if (!selectedSystemId) return
				event.preventDefault()
				event.stopPropagation()
				navigate(`/warehouse/box-systems/${selectedSystemId}`, { replace: true })
				return
			}

			if (event.key === 'Delete' || event.key === 'Del') {
				if (!selectedSystemId) return
				const selectedSystem = boxSystems.find((system: BoxSystem) => system.id === selectedSystemId)
				if (!selectedSystem || selectedSystem.isDefault) return
				event.preventDefault()
				event.stopPropagation()
				await onDeactivateSystem(selectedSystem.id)
			}
		}

		document.addEventListener('keydown', onKeyDown, true)
		return () => {
			document.removeEventListener('keydown', onKeyDown, true)
		}
	}, [archiveSystemId, boxSystems, selectedSystemId, archiveReplacementSystemId, activeHiveCountBySystemId])

	if (loading && !data?.boxSystems) return <Loader />

	return (
		<div className={styles.page}>
			<div className={styles.topBar}>
				<h2><T>Hive systems</T></h2>
				<div className={styles.topBarAction}>
					<Button color="green" href="/warehouse/box-systems/create">
						<T>Create hive system</T>
					</Button>
				</div>
			</div>
			<p className={styles.description}>
				<T>Manage available hive systems used in warehouse and hive workflows.</T>
			</p>
			<ErrorMsg error={error || deactivateSystemError} />

			<section className={styles.detailCard}>
				<div className={styles.systemList}>
					{boxSystems.map((system: BoxSystem, systemIndex: number) => (
						<div
							key={system.id}
							className={`${styles.systemRow} ${selectedSystemId === system.id ? styles.systemRowSelected : ''}`}
							style={getSystemThemeStyle(systemIndex)}
							onMouseEnter={() => setSelectedSystemId(system.id)}
							onClick={() => setSelectedSystemId(system.id)}
						>
							<div className={styles.systemRowMain}>
								<span className={styles.systemColorDot} aria-hidden="true"></span>
									<div className={styles.itemTitleRow}>
										<Link
											className={`${styles.itemTitle} ${styles.itemTitleLink}`}
											to={`/warehouse/box-systems/${system.id}`}
											onClick={(event) => {
												event.stopPropagation()
											}}
										>
											{system.name}
										</Link>
										{system.isDefault ? <span className={styles.defaultBadge}><T>Default</T></span> : null}
										<span className={styles.usageBadge}>
											{activeHiveCountBySystemId[system.id] || 0} <T>hives in use</T>
										</span>
									</div>
								</div>
								<div className={styles.systemRowActions}>
									<div className={styles.controls}>
										{system.isDefault ? null : (
											<Button className={styles.systemActionButton} size="small" color="red" onClick={() => onDeactivateSystem(system.id)}>
												<T>Delete</T>
											</Button>
										)}
									</div>
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
				<Modal title={<T>Delete Hive System</T>} onClose={closeArchiveModal}>
					<div className={styles.archiveModalContent}>
						<p className={styles.archiveModalCopy}>
							<T>Are you sure you want to delete this hive system?</T>{' '}
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
								color="red"
								disabled={hivesUsingArchivingSystem > 0 && !archiveReplacementSystemId}
								onClick={onConfirmDeactivateSystem}
							>
								<T>Delete and reassign</T>
							</Button>
						</div>
					</div>
				</Modal>
			) : null}
		</div>
	)
}
