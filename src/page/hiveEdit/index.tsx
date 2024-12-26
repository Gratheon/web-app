import {useState, useEffect} from 'react'
import {NavLink, useLocation, useNavigate, useParams} from 'react-router-dom'
import {useLiveQuery} from 'dexie-react-hooks'

import {useMutation, useQuery} from '@/api'
import Boxes from '@/page/hiveEdit/boxes'

import HIVE_QUERY from '@/page/hiveEdit/_api/hiveQuery.graphql.ts'
import HiveEditDetails from '@/page/hiveEdit/hiveTopInfo'

import ErrorMsg from '@/shared/messageError'
import ErrorGeneral from '@/shared/messageErrorGlobal'
import {boxTypes, getBox, removeBox} from '@/models/boxes.ts'
import {getHive} from '@/models/hive.ts'
import {getApiary} from '@/models/apiary.ts'
import Loader from '@/shared/loader'

import Frame from '@/page/hiveEdit/frame'
import GateBox from '@/page/hiveEdit/gateBox/GateBox.tsx'
import MessageNotFound from '@/shared/messageNotFound'
import HiveAdvisor from '@/page/hiveEdit/hiveAdvisor'
import BreadCrumbs from '@/shared/breadcrumbs'
import T from '@/shared/translate'
import MessageSuccess from '@/shared/messageSuccess'
import HiveIcon from '@/icons/hive.tsx'
import HiveButtons from '@/page/hiveEdit/boxes/hiveButtons.tsx'
import HiveWeightGraph from '@/page/hiveEdit/hiveWeightGraph'

import styles from '@/page/hiveEdit/styles.module.less'
import Treatments from '@/page/hiveEdit/treatments'
import {getFamilyByHive} from '@/models/family.ts'
import { Tab } from '@/shared/tab'
import { TabBar } from '@/shared/tab'
import InspectionList from '../inspectionList'
import BoxButtons from './boxes/box/boxButtons'
import ButtonWithHover from '@/shared/buttonWithHover'
import DeleteIcon from '@/icons/deleteIcon'
import Button from '@/shared/button'

export default function HiveEditForm() {
    const {state} = useLocation()
    const [displayMode, setDisplayMode] = useState('list')
    const location = useLocation()

    let {apiaryId, hiveId, boxId, frameId, frameSideId} = useParams()
    let [error, onError] = useState(null)
    const navigate = useNavigate()

	let [removeBoxMutation] = useMutation(`mutation deactivateBox($id: ID!) {
		deactivateBox(id: $id)
	}
	`)
    
    // fetch url segments
    const isInspectionListView = apiaryId && hiveId && !window.location.pathname.includes('inspections/');

    // Determine the active tab based on the current URL
    useEffect(() => {
        if (location.pathname.includes('/treatments')) {
            setMapTab('treatments')
        } else if (location.pathname.includes('/inspections')) {
            setMapTab('inspections')
        } else if (location.pathname.includes('/metrics')) {
            setMapTab('metrics')
        } else if (location.pathname.includes('/advisor')) {
            setMapTab('advisor')
        } else {
            setMapTab('structure')
        }
    }, [location.pathname])

    let [mapTab, setMapTab] = useState('structure')
    const apiary = useLiveQuery(() => getApiary(+apiaryId), [apiaryId], null)
    const hive = useLiveQuery(() => getHive(+hiveId), [hiveId], null)
    const box = useLiveQuery(() => getBox(+boxId), [boxId], null)
    const family = useLiveQuery(() => getFamilyByHive(+hiveId), [hiveId])

	const [removingBox, setRemovingBox] = useState(false);
	async function onBoxRemove(id: number) {
		if (confirm('Are you sure you want to remove this box?')) {
			setRemovingBox(true)
			const { error } = await removeBoxMutation({ id })

			if (error) {
				return onError(error)
			}

			await removeBox(id)
			setRemovingBox(false)
		}
	}

    if (apiary === null || hive === null) {
        return <Loader/>
    }

    let loading, errorGet, errorNetwork

    // if local cache is empty - query
    if (!apiary || !hive || !hive.inspectionCount) {
        ({
            loading,
            error: errorGet,
            errorNetwork,
        } = useQuery(HIVE_QUERY, {
            variables: {id: +hiveId, apiaryId: +apiaryId},
        }))

        if (loading) {
            return <Loader/>
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
    let errorMsg = <ErrorMsg error={error || errorGet || errorNetwork}/>

    let breadcrumbs = composeBreadCrumbs(apiary, apiaryId, hive, hiveId, box, boxId, frameId)

    function onBoxClose(event) {
        event.stopPropagation()
        navigate(`/apiaries/${apiaryId}/hives/${hiveId}`, {
            replace: true,
        })
    }

    let boxDeleteButton = <Button
            color="red"
            loading={removingBox}
            onClick={() => {
                onBoxRemove(+box.id)
            }}
        ><DeleteIcon /> <T>Remove box</T></Button>
    
    return (
        <>            
            <ErrorGeneral/>

            {errorMsg}

            {state && (
                <MessageSuccess
                    title={<T>{state.title}</T>}
                    message={<T>{state.message}</T>}
                />
            )}

            <BreadCrumbs items={breadcrumbs}/>
            
            <HiveEditDetails apiaryId={apiaryId} hiveId={hiveId}/>

            <TabBar>
				<Tab isSelected={mapTab === 'structure'}>
                    <NavLink to={`/apiaries/${apiaryId}/hives/${hiveId}`} className={({ isActive }) => (isActive ? styles.active : '')}>
                        <T>Structure</T>
                    </NavLink>
                </Tab>
				<Tab isSelected={mapTab === 'treatments'}>
                    <NavLink to={`/apiaries/${apiaryId}/hives/${hiveId}/treatments`} className={({ isActive }) => (isActive ? styles.active : '')}>
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
                    <NavLink to={`/apiaries/${apiaryId}/hives/${hiveId}/metrics`} className={({ isActive }) => (isActive ? styles.active : '')}>
                        <T>Metrics</T>
                    </NavLink>
                </Tab>
				<Tab isSelected={mapTab === 'advisor'}>
                    <NavLink to={`/apiaries/${apiaryId}/hives/${hiveId}/advisor`} className={({ isActive }) => (isActive ? styles.active : '')}>
                        <T>Advisor</T>
                    </NavLink>
                </Tab>
			</TabBar>

            <div className={styles.boxesFrameWrap}>
                {mapTab === 'structure' && 
                    <div className={styles.boxesWrap}>
                        <HiveButtons apiaryId={apiaryId} hiveId={hiveId}/>

                        <Boxes
                            onError={onError}
                            apiaryId={apiaryId}
                            hiveId={hiveId}
                            boxId={boxId}
                            frameId={frameId}
                            frameSideId={frameSideId}
                            displayMode={displayMode}
                            setDisplayMode={setDisplayMode}
                        />
                    </div>}

                <div className={styles.frameWrap}>
                    {mapTab === 'treatments' && <Treatments hiveId={hiveId} boxId={boxId}/>}
                    {mapTab === 'inspections' && <InspectionList breadcrumbs={breadcrumbs}/>}
                    {mapTab === 'metrics' && <HiveWeightGraph hiveId={hiveId}/>}
                    {mapTab === 'advisor' && <HiveAdvisor apiary={apiary} hive={hive} hiveId={hiveId}/>}


                    {mapTab === 'structure' && <div>
                        {box && box.type === boxTypes.GATE && <GateBox boxId={boxId}/>}
                        <Frame
                            box={box}
                            apiaryId={apiaryId}
                            boxId={boxId}
                            frameId={frameId}
                            hiveId={hiveId}
                            frameSideId={frameSideId}
                            extraButtons={boxDeleteButton}
                        />

                        {!frameId && <Button
                            color="red"
                            loading={removingBox}
                            onClick={() => {
                                onBoxRemove(+box.id)
                            }}
                        ><DeleteIcon /> <T>Remove box</T></Button>}
                    </div>}

                </div>
            </div>
        </>
    )
}

function composeBreadCrumbs(apiary: any, apiaryId: string, hive: any, hiveId: string, box: any, boxId: string, frameId: string) {
    let breadcrumbs = []

    if (apiary) {
        breadcrumbs[0] = {
            name: (
                <>
                    «{apiary.name}» <T>apiary</T>
                </>
            ),
            uri: `/apiaries/edit/${apiaryId}`,
        }
    }

    if (hive) {
        breadcrumbs[1] = {
            icon: <HiveIcon size={12} />,
            name: (
                <>
                    «{hive.name}» <T>hive</T>
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

