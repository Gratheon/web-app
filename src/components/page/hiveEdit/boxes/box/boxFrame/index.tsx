import {useNavigate} from 'react-router-dom'
import {useLiveQuery} from 'dexie-react-hooks'

import {Box} from '@/components/models/boxes'
import {Frame} from '@/components/models/frames'

import styles from './index.less'
import FrameSide from './boxFrameHalf'
import {enrichFramesWithSides} from '@/components/models/frameSide'
import FrameSideImage from './frameSideImage'


export default function BoxFrame({
                                     box,
                                     apiaryId,
                                     hiveId,
                                     frameId,
                                     frameSideId,
                                     frame,
                                     editable = true,
                                     displayMode = 'visual',
                                 }: {
    box: Box
    apiaryId: number
    hiveId: number
    frameId: number
    frameSideId: number
    frame: Frame

    editable: Boolean
    displayMode: string
}) {
    const frameWithSides = useLiveQuery(async () => {
        let tmp = await enrichFramesWithSides([frame]);
        return tmp[0]
    }, [frame, frameId, frameSideId]);

    if (!frameWithSides) return null


    const selectedFrame = frame.id === +frameId
    let navigate = useNavigate()

    let frameInternal = null
    const frameURL = `/apiaries/${apiaryId}/hives/${hiveId}/box/${box.id}/frame/${frame.id}`


    if (displayMode == 'visual') {

        if (frame.type === 'FOUNDATION' || frame.type === 'EMPTY_COMB') {
            return <div className={styles.listFrameIcon} style="margin:3px;">
                <FrameSideImage
                    frameSideId={frameWithSides.leftSide.id}
                    frameURL={`${frameURL}/${frame.leftId}`}
                    selected={+frameSideId == +frame.leftId}
                    editable={editable}/>

                <FrameSideImage
                    frameSideId={frameWithSides.rightSide.id}
                    frameURL={`${frameURL}/${frame.rightId}`}
                    selected={+frameSideId == +frame.rightId}
                    editable={editable}/>
            </div>
        } else {
            // TODO add more frame type renditions from the side
            return
        }
    }

    if (frame.type === 'VOID') {
        frameInternal = <div onClick={() => {
            if (editable) {
                navigate(frameURL, {replace: true})
            }
        }} className={styles.voidFrame}/>
    } else if (frame.type === 'PARTITION') {
        frameInternal = <div onClick={() => {
            if (editable) {
                navigate(frameURL, {replace: true})
            }
        }} className={styles.partition}/>
    } else if (frame.type === 'FEEDER') {
        frameInternal = <div onClick={() => {
            if (editable) {
                navigate(frameURL, {replace: true})
            }
        }} className={styles.feeder}/>
    } else if (frame.type === 'FOUNDATION') {
        frameInternal = (
            <div className={styles.foundationFrame} onClick={() => {
                if (editable) {
                    navigate(frameURL, {replace: true})
                }
            }}>
                <div style={{flexGrow: 1}}/>
                <div className={styles.foundation}/>
                <div style={{flexGrow: 1}}/>
            </div>
        )
    } else if (frame.type === 'EMPTY_COMB') {
        frameInternal = (
            <div className={styles.emptyComb}>
                <FrameSide
                    onFrameSideClick={() => {
                        if (editable) {
                            navigate(`${frameURL}/${frame.leftId}`, {replace: true})
                        }
                    }}
                    className={styles.left}
                    frameSide={frame.leftSide}
                />

                <div className={styles.foundation}/>

                <FrameSide
                    className={styles.right}
                    onFrameSideClick={() => {
                        if (editable) {
                            navigate(`${frameURL}/${frame.rightId}`, {replace: true})
                        }
                    }}
                    frameSide={frame.rightSide}
                />
            </div>
        )
    }

    return (
        <div className={`${styles.frame} ${selectedFrame && styles.frameSelected}`}>
            {frameInternal}
        </div>
    )
}
