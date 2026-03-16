import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { useQuery } from '@/api'
import Boxes from '@/page/hiveEdit/boxes'

import HIVE_QUERY from '@/page/hiveEdit/_api/hiveQuery.graphql.ts'
import HiveEditDetails from '@/page/hiveEdit/hiveTopInfo'

import ErrorMsg from '@/shared/messageError'
import ErrorGeneral from '@/shared/messageErrorGlobal'
import { boxTypes, getBox, getBoxes } from '@/models/boxes.ts'
import { getHive, isCollapsed, isEditable } from '@/models/hive.ts'
import { getApiary } from '@/models/apiary.ts'
import Loader from '@/shared/loader'
import { getFrames } from '@/models/frames.ts'

import Frame from '@/page/hiveEdit/frame'
import GateBox from '@/page/hiveEdit/gateBox/GateBox.tsx'
import BottomBox from '@/page/hiveEdit/bottomBox/BottomBox.tsx'
import MessageNotFound from '@/shared/messageNotFound'
import BreadCrumbs from '@/shared/breadcrumbs'
import T from '@/shared/translate'
import MessageSuccess from '@/shared/messageSuccess'
import HiveIcon from '@/icons/hive.tsx'
import HiveButtons from '@/page/hiveEdit/boxes/hiveButtons.tsx'
import HiveWeightGraph from '@/page/hiveEdit/hiveWeightGraph'
import HiveLogs from '@/page/hiveEdit/logs'
import { syncHiveLineageLogs } from '@/models/hiveLog'

import styles from '@/page/hiveEdit/styles.module.less'
import Treatments from '@/page/hiveEdit/treatments'
import { getFamilyByHive } from '@/models/family.ts'
import { Tab } from '@/shared/tab'
import { TabBar } from '@/shared/tab'
import InspectionList from '../inspectionList'
import CollapseHiveModal from './CollapseHiveModal'; // Import the modal component

export default function HiveEditForm() {
	const { state } = useLocation()
	const [displayMode, setDisplayMode] = useState('list')
	const [topNotice, setTopNotice] = useState(null)
	const location = useLocation()
	let [mapTab, setMapTab] = useState('structure')
	const [openFrameRemoveDialogSignal, setOpenFrameRemoveDialogSignal] = useState(0)
	const [openBoxRemoveDialogSignal, setOpenBoxRemoveDialogSignal] = useState(0)

	let { apiaryId, hiveId, boxId, frameId, frameSideId } = useParams()
	let [error, onError] = useState(null)
	const navigate = useNavigate()

	useEffect(() => {
		const isTypingTarget = (target) => {
			if (!target) return false
			const tagName = String(target.tagName || '').toLowerCase()
			return (
				target.isContentEditable ||
				tagName === 'input' ||
				tagName === 'textarea' ||
				tagName === 'select'
			)
		}

		const isModalTarget = (target) => {
			if (!target || typeof target.closest !== 'function') return false
			return Boolean(target.closest('[class*="modalOverlay"], [class*="modalContent"]'))
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.defaultPrevented) return
			if (event.ctrlKey || event.metaKey || event.altKey) return
			if (event.repeat) return
			if (isTypingTarget(event.target)) return
			if (isModalTarget(event.target)) return

			const key = event.key

			if (key.toLowerCase() === 'a') {
				if (!apiaryId) return
				event.preventDefault()
				navigate(`/apiaries/${apiaryId}`, { replace: true })
				return
			}

			if (key.toLowerCase() === 'h') {
				event.preventDefault()
				navigate('/apiaries', { replace: true })
				return
			}

			if (mapTab !== 'structure') return

			if (key === 'Backspace') {
				event.preventDefault()
				if (boxId) {
					setOpenBoxRemoveDialogSignal((v) => v + 1)
				}
				return
			}

			if (key === 'Delete' || key === 'Del') {
				event.preventDefault()
				if (frameId) {
					setOpenFrameRemoveDialogSignal((v) => v + 1)
				}
				return
			}

			if (!apiaryId || !hiveId) return

			if (key === 'ArrowUp' || key === 'ArrowDown') {
				event.preventDefault()
				;(async () => {
					const boxes = await getBoxes({ hiveId: +hiveId })
					if (!boxes?.length) return
					const sortedBoxes = [...boxes].sort((a, b) => a.position - b.position)
					const currentIndex = boxId
						? sortedBoxes.findIndex((b) => b.id === +boxId)
						: -1

					let nextIndex = currentIndex
					if (key === 'ArrowUp') {
						nextIndex =
							currentIndex < 0
								? 0
								: currentIndex >= sortedBoxes.length - 1
									? sortedBoxes.length - 1
									: currentIndex + 1
					} else {
						nextIndex = currentIndex <= 0 ? 0 : currentIndex - 1
					}

					if (nextIndex === currentIndex || nextIndex < 0) return
					const nextBox = sortedBoxes[nextIndex]
					navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${nextBox.id}`, {
						replace: true,
					})
				})()
				return
			}

			if ((key === 'ArrowLeft' || key === 'ArrowRight') && boxId) {
				event.preventDefault()
				;(async () => {
					const frames = await getFrames({ boxId: +boxId })
					if (!frames?.length) return
					const sortedFrames = [...frames].sort((a, b) => a.position - b.position)
					const currentIndex = frameId
						? sortedFrames.findIndex((f) => f.id === +frameId)
						: -1

					let nextIndex = currentIndex
					if (key === 'ArrowLeft') {
						nextIndex = currentIndex <= 0 ? 0 : currentIndex - 1
					} else {
						nextIndex =
							currentIndex < 0
								? 0
								: currentIndex >= sortedFrames.length - 1
									? sortedFrames.length - 1
									: currentIndex + 1
					}

					if (nextIndex === currentIndex || nextIndex < 0) return

					const nextFrame = sortedFrames[nextIndex]
					const currentFrame = currentIndex >= 0 ? sortedFrames[currentIndex] : null
					const shouldStayOnRightSide =
						Boolean(currentFrame) && +frameSideId === +currentFrame.rightId
					const nextFrameSideId = shouldStayOnRightSide
						? nextFrame.rightId || nextFrame.leftId
						: nextFrame.leftId || nextFrame.rightId

					if (!nextFrameSideId) return

					navigate(
						`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}/frame/${nextFrame.id}/${nextFrameSideId}`,
						{ replace: true }
					)
				})()
			}
		}

		document.addEventListener('keydown', onKeyDown, true)
		return () => document.removeEventListener('keydown', onKeyDown, true)
	}, [apiaryId, boxId, frameId, frameSideId, hiveId, mapTab, navigate])

	// fetch url segments
	const isInspectionListView =
		apiaryId && hiveId && !window.location.pathname.includes('inspections/')

	// Determine the active tab based on the current URL
	useEffect(() => {
		if (location.pathname.includes('/treatments')) {
			setMapTab('treatments')
		} else if (location.pathname.includes('/inspections')) {
			setMapTab('inspections')
		} else if (location.pathname.includes('/metrics')) {
			setMapTab('metrics')
		} else {
			setMapTab('structure')
		}
	}, [location.pathname])

	// Model functions now handle invalid IDs
	const apiary = useLiveQuery(() => getApiary(+apiaryId), [apiaryId], null);
	const hive = useLiveQuery(() => getHive(+hiveId), [hiveId], null);
	const box = useLiveQuery(() => getBox(+boxId), [boxId], null);
	const family = useLiveQuery(() => getFamilyByHive(+hiveId), [hiveId]);

	useEffect(() => {
		if (!hive) return
		syncHiveLineageLogs(hive).catch((e) => console.error('Failed to sync lineage logs', e))
	}, [hive?.id, hive?.splitDate, hive?.mergeDate, hive?.parentHive?.id, hive?.mergedIntoHive?.id, hive?.childHives?.length, hive?.mergedFromHives?.length])
	

	if (apiary === null || hive === null) {
		return <Loader />
	}

	let loading, errorGet, errorNetwork

	// if local cache is empty - query
	if (!apiary || !hive || !hive.inspectionCount) {
		;({
			loading,
			error: errorGet,
			errorNetwork,
		} = useQuery(HIVE_QUERY, {
			variables: { id: +hiveId, apiaryId: +apiaryId },
		}))

		if (loading) {
			return <Loader />
		}

		if (!hive) {
			return (
				<MessageNotFound msg={<T>Hive not found</T>}>
					<div>
						<T ctx="this is a not-found error message">
							Hive was either deleted, never existed or we have a navigation or
							backend error. You can create new hive from apiary list view
						</T>
					</div>
				</MessageNotFound>
			)
		}
	}

	// inline error from deeper components
	let errorMsg = <ErrorMsg error={error || errorGet || errorNetwork} />

	let breadcrumbs = composeBreadCrumbs(
		apiary,
		apiaryId,
		hive,
		hiveId,
		box,
		boxId,
		frameId
	)

	function onBoxClose(event) {
		event.stopPropagation()
		navigate(`/apiaries/${apiaryId}/hives/${hiveId}`, {
			replace: true,
		})
	}

	return (
		<>
			<ErrorGeneral />

			{errorMsg}

			{state && (
				<MessageSuccess
					title={<T>{state.title}</T>}
					message={<T>{state.message}</T>}
				/>
			)}

			{topNotice}

			<BreadCrumbs items={breadcrumbs} className={styles.breadcrumbsSky} />

			<HiveEditDetails apiaryId={apiaryId} hiveId={hiveId} onTopMessageChange={setTopNotice} />

			<div className={styles.tabsWrap}>
				<TabBar>
					<Tab isSelected={mapTab === 'structure'}>
						<NavLink
							to={`/apiaries/${apiaryId}/hives/${hiveId}`}
							className={({ isActive }) => (isActive ? styles.active : '')}
						>
							<T>Structure</T>
						</NavLink>
					</Tab>
					<Tab isSelected={mapTab === 'treatments'}>
						<NavLink
							to={`/apiaries/${apiaryId}/hives/${hiveId}/treatments`}
							className={({ isActive }) => (isActive ? styles.active : '')}
						>
							<T>Treatments</T>
						</NavLink>
					</Tab>

					<Tab isSelected={mapTab === 'inspections'}>
						<NavLink
							className={({ isActive }) => (isActive ? styles.active : '')}
							to={`/apiaries/${apiaryId}/hives/${hiveId}/inspections`}
						>
							<T>Inspections</T> ({hive.inspectionCount})
						</NavLink>
					</Tab>

					<Tab isSelected={mapTab === 'metrics'}>
						<NavLink
							to={`/apiaries/${apiaryId}/hives/${hiveId}/metrics`}
							className={({ isActive }) => (isActive ? styles.active : '')}
						>
							<T>Metrics</T>
						</NavLink>
					</Tab>
				</TabBar>
			</div>

			<div className={styles.boxesFrameWrap}>
				{mapTab === 'structure' && (
					<div className={styles.boxesWrap}>
						<Boxes
							onError={onError}
							apiaryId={apiaryId}
							hiveId={hiveId}
							boxId={boxId}
							frameId={frameId}
							frameSideId={frameSideId}
							displayMode={displayMode}
							setDisplayMode={setDisplayMode}
							editable={isEditable(hive)}
						/>
						<div className={styles.boxActionsUnderSections}>
							<HiveButtons
								apiaryId={apiaryId}
								hiveId={hiveId}
								box={box}
								frameId={frameId}
								mode="removeOnly"
								openRemoveDialogSignal={openBoxRemoveDialogSignal}
								onRemoveDialogSignalConsumed={() => setOpenBoxRemoveDialogSignal(0)}
							/>
						</div>
					</div>
				)}

				<div className={styles.frameWrap}>
					{mapTab === 'treatments' && (
						<Treatments hiveId={hiveId} boxId={boxId} />
					)}
					{mapTab === 'inspections' && (
						<InspectionList breadcrumbs={breadcrumbs} />
					)}
					{mapTab === 'metrics' && <HiveWeightGraph hiveId={hiveId} />}

					{mapTab === 'structure' && (
						<div>
							{box && box.type === boxTypes.GATE && <GateBox boxId={boxId} hiveId={hiveId} />}
							<Frame
								box={box}
								apiaryId={apiaryId}
								boxId={boxId}
								frameId={frameId}
								hiveId={hiveId}
								frameSideId={frameSideId}
								extraButtons={null}
								openRemoveDialogSignal={openFrameRemoveDialogSignal}
								onRemoveDialogSignalConsumed={() => setOpenFrameRemoveDialogSignal(0)}
							/>

							<HiveButtons apiaryId={apiaryId} hiveId={hiveId} box={box} frameId={frameId} mode="nonRemove" />

							{box && box.type === boxTypes.BOTTOM && <BottomBox boxId={boxId} hiveId={hiveId} />}

							{/* {!frameId && <Button
                            color="red"
                            loading={removingBox}
                            onClick={() => {
                                onBoxRemove(+box.id)
                            }}
                        ><DeleteIcon /> <T>Remove box</T></Button>} */}
						</div>
					)}
				</div>
				{mapTab === 'structure' && !boxId && (
					<div className={styles.logsWrap}>
						<HiveLogs hiveId={hiveId} apiaryId={apiaryId} />
					</div>
				)}
			</div>
		</>
	)
}

function composeBreadCrumbs(
	apiary: any,
	apiaryId: string,
	hive: any,
	hiveId: string,
	box: any,
	boxId: string,
	frameId: string
) {
	let breadcrumbs = []

	if (apiary) {
		breadcrumbs[0] = {
			name: (
				<>
					«{apiary.name}» <T>apiary</T>
				</>
			),
			uri: `/apiaries/${apiaryId}`,
		}
	}

	if (hive) {
		breadcrumbs[1] = {
			icon: <HiveIcon size={12} />,
			name: (
				<>
					{hive.hiveNumber ? `#${hive.hiveNumber}` : <T>Hive</T>}
				</>
			),
			uri: `/apiaries/${apiaryId}/hives/${hiveId}`,
		}
	}

	if (box) {
		if (box.type === boxTypes.GATE) {
			breadcrumbs.push({
				name: (
					<>
						{box.id}{' '}
						<T ctx="this is part of the beehive where bees enter or exit">
							entrance
						</T>
					</>
				),
				uri: `/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`,
			})
		} else if (box.type === boxTypes.BOTTOM) {
			breadcrumbs.push({
				name: (
					<>
						{box.id}{' '}
						<T ctx="this is the bottom board of the beehive used for varroa monitoring">
							bottom
						</T>
					</>
				),
				uri: `/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`,
			})
		} else {
			breadcrumbs.push({
				name: (
					<>
						{box.id}{' '}
						<T ctx="this is a box or a section of the vertical beehive">
							section
						</T>
					</>
				),
				uri: `/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`,
			})
		}
	}

	if (frameId) {
		breadcrumbs.push({
			name: (
				<>
					{frameId}{' '}
					<T ctx="this is internal wooden part of the beehive where bees have comb and store honey or keep eggs or larvae">
						frame
					</T>
				</>
			),
			uri: `/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}/frame/${frameId}`,
		})
	}
	return breadcrumbs
}
