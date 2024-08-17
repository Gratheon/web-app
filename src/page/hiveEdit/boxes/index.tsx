import {useNavigate} from 'react-router'
import {useLiveQuery} from 'dexie-react-hooks'

import {getBoxes} from '../../../models/boxes.ts'
import {useQuery} from '../../../api'
import Loader from '../../../shared/loader'
import HiveBoxes from '../../../shared/hiveBoxes'

import BOXES_QUERY from './boxesQuery.graphql.ts'


type BoxesProps = {
    hiveId: any
    apiaryId: any
    boxId: any
    frameId: any
    frameSideId: any

    editable?: boolean

    onBoxClick?: any
    onBoxRemove?: any
    onBoxAdd?: any
    onMoveDown?: any

    onFrameClose?: any
    onFrameAdd?: any
    onFrameSideFileUpload?: any
    onDragDropFrame?: any
    onFrameSideStatChange?: any

    onError: any
    setDisplayMode: any
    displayMode: string
}

export default function Boxes({
                                  hiveId,
                                  apiaryId,
                                  boxId,
                                  frameId,
                                  frameSideId,
                                  onError,
                                  editable = true,
                                  displayMode = 'visual',
                                  setDisplayMode,
                              }: BoxesProps) {
    let navigate = useNavigate()

    const boxes = useLiveQuery(() => getBoxes({hiveId: +hiveId}), [hiveId], false)

    if (boxes === false) {
        return <Loader/>
    }

    if (boxes?.length == 0) {
        let {loading} = useQuery(BOXES_QUERY, {variables: {id: +hiveId, apiaryId: +apiaryId}})

        if (loading) {
            return <Loader/>
        }
    }

    function onBoxClick({event, boxId}) {
        // whitelist boxes that can be clicked on
        // so that we don't redirect when clicking on the background div
        if (
            typeof event.target.className === 'string' &&
            event.target.className.length > 0 &&
            (
                event.target.className.indexOf('ventilation') >= 0 ||
                event.target.className.indexOf('excluder') >= 0 ||
                event.target.className.indexOf('feeder') >= 0 ||
                event.target.className.indexOf('box') >= 0 ||
                event.target.className.indexOf('gate') >= 0
            )
        ) {
            event.stopPropagation()
            navigate(`/apiaries/${apiaryId}/hives/${hiveId}/box/${boxId}`, {
                replace: true,
            })
        }
    }

    return (
        <HiveBoxes
            boxes={boxes}

            apiaryId={apiaryId}
            hiveId={hiveId}
            boxId={boxId}
            frameId={frameId}
            frameSideId={frameSideId}

            setDisplayMode={setDisplayMode}
            onBoxClick={onBoxClick}
            onError={onError}
            editable={editable}
            displayMode={displayMode}
        />
    )
}
