import InspectionView from "../inspectionList/inspectionView";
import {useParams} from "react-router-dom";
import {saveShareToken} from "../../user.ts";

export default function InspectionShare() {
    let {apiaryId, hiveId, boxId, inspectionId, shareToken} = useParams()

    console.log({shareToken})

    if (shareToken) {
        saveShareToken(shareToken)
    }

    return <>

        {inspectionId && <InspectionView
            apiaryId={apiaryId}
            hiveId={hiveId}
            inspectionId={inspectionId}
        />}
    </>
}