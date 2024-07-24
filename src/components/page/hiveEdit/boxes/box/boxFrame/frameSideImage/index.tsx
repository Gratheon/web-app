import {useNavigate} from 'react-router-dom'
import {useLiveQuery} from 'dexie-react-hooks';

import {File, getFile} from '@/components/models/files'
import {getFrameSideFile} from '@/components/models/frameSideFile';
import {getFileResizes} from '@/components/models/fileResize';

import styles from './index.less'

export default function FrameSideImage({
                                           editable,
                                           selected = true,

                                           frameSideId,
                                           frameURL,

                                       }) {
    let navigate = useNavigate()

    let frameSideFile = useLiveQuery(() => getFrameSideFile({
        frameSideId
    }), [frameSideId])

    let file: File = useLiveQuery(async (): Promise<File> => {
        if (!frameSideFile) {
            return null
        }
        return await getFile(frameSideFile?.fileId)
    }, [frameSideFile, frameSideId]);

    let resizes = useLiveQuery(() => {
        return frameSideFile && getFileResizes({file_id: +frameSideFile?.fileId})
    }, [frameSideId, frameSideFile], null);

    let url = file && file.url
    let selectedSize = 2000;

    if (resizes != null && resizes.length > 0) {
        for (let i = 0; i < resizes.length; i++) {
            if (resizes[i].max_dimension_px < selectedSize) {
                selectedSize = resizes[i].max_dimension_px
                url = resizes[i].url
            }
        }
    }

    return (
        <div className={selected ? `${styles.frameSideImage} ${styles.selected}` : styles.frameSideImage}
             onClick={() => {
                 if (editable) {
                     navigate(frameURL, {replace: true})
                 }
             }}>
            {!file && <div className={styles.frameSideImageInternalTop}></div>}
            {!file && <div className={styles.frameSideImageInternalSides}></div>}

            {file && <img src={url}/>}
        </div>
    )
}