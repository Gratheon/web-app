import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { gql, useMutation, useQuery } from '@/api'
import Button from '@/shared/button'
import ErrorMsg from '@/shared/messageError'
import Loader from '@/shared/loader'
import T from '@/shared/translate'
import { GROUPS, MODULES } from './modules'
import { getWarehouseModuleIcon } from './iconMap'
import styles from './style.module.less'

type WarehouseCounts = Record<string, number>

const WAREHOUSE_MODULES_QUERY = gql`
{
	warehouseModules {
		moduleType
		count
	}
	warehouseSettings {
		autoUpdateFromHives
	}
}
`

const SET_WAREHOUSE_MODULE_COUNT_MUTATION = gql`
mutation setWarehouseModuleCount($moduleType: WarehouseModuleType!, $count: Int!) {
	setWarehouseModuleCount(moduleType: $moduleType, count: $count) {
		moduleType
		count
	}
}
`

const SET_WAREHOUSE_AUTO_UPDATE_MUTATION = gql`
mutation setWarehouseAutoUpdateFromHives($enabled: Boolean!) {
	setWarehouseAutoUpdateFromHives(enabled: $enabled) {
		autoUpdateFromHives
	}
}
`

const MAX_VISUAL_SQUARES = 100
const SQUARE_PITCH = 5
const SQUARE_COLUMNS = 12
const SQUARE_AREA_HEIGHT = 52

function getSquareStyle(index: number) {
	const column = index % SQUARE_COLUMNS
	const row = Math.floor(index / SQUARE_COLUMNS)
	const x = column * SQUARE_PITCH
	const y = SQUARE_AREA_HEIGHT - 3 - row * SQUARE_PITCH
	const delay = Math.min(index * 0.01, 0.35)

	return {
		left: `${x}px`,
		top: `${y}px`,
		animationDelay: `${delay}s`,
	}
}

function emptyCounts() {
	return MODULES.reduce<WarehouseCounts>((acc, module) => {
		acc[module.id] = 0
		return acc
	}, {})
}

function mapCounts(modules: Array<{ moduleType: string; count: number }> = []) {
	const counts = emptyCounts()

	for (const module of modules) {
		const value = Number(module.count)
		counts[module.moduleType] = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
	}

	return counts
}

export default function WarehousePage() {
	const [counts, setCounts] = useState<WarehouseCounts>(() => emptyCounts())
	const [inputs, setInputs] = useState<Record<string, string>>(() =>
		MODULES.reduce<Record<string, string>>((acc, module) => {
			acc[module.id] = '0'
			return acc
		}, {})
	)
	const [savingModule, setSavingModule] = useState<string | null>(null)
	const [autoUpdateFromHives, setAutoUpdateFromHives] = useState(true)
	const [savingAutoUpdate, setSavingAutoUpdate] = useState(false)

	const { data, loading, error } = useQuery(WAREHOUSE_MODULES_QUERY)
	const [setWarehouseModuleCount, { error: mutationError }] = useMutation(SET_WAREHOUSE_MODULE_COUNT_MUTATION)
	const [setWarehouseAutoUpdate, { error: settingsMutationError }] = useMutation(SET_WAREHOUSE_AUTO_UPDATE_MUTATION)

	useEffect(() => {
		const nextCounts = mapCounts(data?.warehouseModules || [])
		setCounts(nextCounts)
		setInputs(
			MODULES.reduce<Record<string, string>>((acc, module) => {
				acc[module.id] = String(nextCounts[module.id] || 0)
				return acc
			}, {})
		)

		if (typeof data?.warehouseSettings?.autoUpdateFromHives === 'boolean') {
			setAutoUpdateFromHives(data.warehouseSettings.autoUpdateFromHives)
		}
	}, [data?.warehouseModules, data?.warehouseSettings?.autoUpdateFromHives])

	async function saveCount(moduleId: string, nextValue: number) {
		const previousValue = counts[moduleId] || 0
		if (nextValue === previousValue) {
			return
		}

		setCounts((prev) => ({
			...prev,
			[moduleId]: nextValue,
		}))
		setSavingModule(moduleId)

		const result = await setWarehouseModuleCount({
			moduleType: moduleId,
			count: nextValue,
		})
		setSavingModule(null)

		if (result?.data?.setWarehouseModuleCount) {
			const confirmedValue = Math.max(0, Number(result.data.setWarehouseModuleCount.count) || 0)
			setCounts((prev) => ({
				...prev,
				[moduleId]: confirmedValue,
			}))
			setInputs((prev) => ({
				...prev,
				[moduleId]: String(confirmedValue),
			}))
			return
		}

		setCounts((prev) => ({
			...prev,
			[moduleId]: previousValue,
		}))
		setInputs((prev) => ({
			...prev,
			[moduleId]: String(previousValue),
		}))
	}

	async function updateCount(moduleId: string, delta: number) {
		const nextValue = Math.max(0, (counts[moduleId] || 0) + delta)
		setInputs((prev) => ({
			...prev,
			[moduleId]: String(nextValue),
		}))
		await saveCount(moduleId, nextValue)
	}

	function onInputChange(moduleId: string, value: string) {
		const digitsOnly = value.replace(/[^\d]/g, '')
		setInputs((prev) => ({
			...prev,
			[moduleId]: digitsOnly,
		}))
	}

	async function onInputCommit(moduleId: string) {
		const raw = inputs[moduleId] ?? '0'
		const parsed = Number.parseInt(raw === '' ? '0' : raw, 10)
		const nextValue = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
		setInputs((prev) => ({
			...prev,
			[moduleId]: String(nextValue),
		}))
		await saveCount(moduleId, nextValue)
	}

	async function onAutoUpdateToggle(nextValue: boolean) {
		const previous = autoUpdateFromHives
		setAutoUpdateFromHives(nextValue)
		setSavingAutoUpdate(true)

		const result = await setWarehouseAutoUpdate({ enabled: nextValue })
		setSavingAutoUpdate(false)

		if (typeof result?.data?.setWarehouseAutoUpdateFromHives?.autoUpdateFromHives === 'boolean') {
			setAutoUpdateFromHives(result.data.setWarehouseAutoUpdateFromHives.autoUpdateFromHives)
			return
		}

		setAutoUpdateFromHives(previous)
	}

	if (loading && !data?.warehouseModules) {
		return <Loader />
	}

	return (
		<div className={styles.page}>
			<h2><T>Warehouse</T></h2>
			<p className={styles.description}>
				<T>Track available hive modules with simple count operations.</T>
			</p>
			<ErrorMsg error={error || mutationError || settingsMutationError} />

			<div className={styles.topSetting}>
				<label className={styles.switchRow}>
					<input
						className={styles.switchInput}
						type="checkbox"
						checked={autoUpdateFromHives}
						disabled={savingAutoUpdate}
						onChange={(event: any) => onAutoUpdateToggle(!!event.target.checked)}
					/>
					<span className={styles.switchTrack} aria-hidden="true">
						<span className={styles.switchThumb}></span>
					</span>
					<span className={styles.switchLabel}>
						<T>Automatically update warehouse count when hives are updated</T>
					</span>
				</label>
			</div>

			<div className={styles.list}>
				{GROUPS.map((group) => (
					<section className={styles.group} key={group.id}>
						<h3 className={styles.groupTitle}><T>{group.title}</T></h3>
						<div className={styles.groupItems}>
							{group.items.map((module) => {
								const count = counts[module.id] || 0
								const icon = getWarehouseModuleIcon(module.id, 14)
								return (
									<div className={styles.row} key={module.id}>
										<div className={styles.itemInfo}>
											<div className={styles.itemTitleRow}>
												{icon && (
													<span className={styles.itemIconBadge} aria-hidden="true">
														<span className={styles.itemIcon}>{icon}</span>
													</span>
												)}
												<Link to={`/warehouse/${module.id}`} className={styles.itemTitleLink}>
													<span className={styles.itemTitle}><T>{module.label}</T></span>
												</Link>
											</div>
											<div className={styles.itemDescription}><T>{module.description}</T></div>
										</div>

										<div className={styles.controls}>
											<div className={styles.squareStack} title={`${Math.min(count, MAX_VISUAL_SQUARES)} / ${count}`}>
												{Array.from({
													length: Math.min(count, MAX_VISUAL_SQUARES),
												}).map((_, index) => (
													<span
														key={`${module.id}-sq-${index}`}
														className={styles.square}
														style={getSquareStyle(index)}
													></span>
												))}
											</div>
											<Button
												size="small"
												title="Decrease"
												onClick={() => updateCount(module.id, -1)}
												disabled={count <= 0 || savingModule === module.id}
											>
												-
											</Button>
											<input
												className={styles.countInput}
												type="number"
												min={0}
												step={1}
												inputMode="numeric"
												value={inputs[module.id] ?? String(count)}
												disabled={savingModule === module.id}
												onInput={(event: any) => onInputChange(module.id, event.target.value)}
												onBlur={() => onInputCommit(module.id)}
												onKeyDown={(event: any) => {
													if (event.key === 'Enter') {
														event.currentTarget.blur()
													}
												}}
											/>
											<Button
												size="small"
												color="green"
												title="Increase"
												disabled={savingModule === module.id}
												onClick={() => updateCount(module.id, 1)}
											>
												+
											</Button>
										</div>
									</div>
								)
							})}
						</div>
					</section>
				))}
			</div>
		</div>
	)
}
