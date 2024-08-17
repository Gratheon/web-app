import {useState} from "react";

import {gql, useMutation, useQuery} from "@/api";
import Button from "@/shared/button";
import Loader from "@/shared/loader";
import ErrorMsg from "@/shared/messageError";
import T from "@/shared/translate";

import {getUser} from "@/models/user";
import {getHive} from "@/models/hive";
import {getBoxes} from "@/models/boxes";
import {getFamilyByHive} from "@/models/family";
import {getFrames} from "@/models/frames";
import {getFrameSideCells} from "@/models/frameSideCells";
import {getFrameSideFile} from "@/models/frameSideFile";

import style from "./style.module.less"
import beekeeperURL from "@/assets/beekeeper.png"

export default function HiveAdvisor({hiveId, apiary, hive}) {
    let [saving, setSaving] = useState(false);
    let {loading, error: errorGet, data: existingAdvice} = useQuery(gql`
		query apiary($hiveID: ID!) {
			getExistingHiveAdvice(hiveID: $hiveID)
		}`, {variables: {hiveID: +hiveId}})

    let [generateAdvice, {error: mutateError, data: generatedAdvice}] = useMutation(gql`
mutation generateHiveAdvice($hiveID: ID, $adviceContext: JSON, $langCode: String){
	generateHiveAdvice(hiveID: $hiveID, adviceContext: $adviceContext, langCode: $langCode)
}
`)

    let showLoader = (loading || saving)
    return <>
        <ErrorMsg error={errorGet || mutateError}/>

        <div className={style.wrap}>
            {showLoader && <Loader/>}


                <div style={`flex-grow:1; text-align:center;${existingAdvice?.getExistingHiveAdvice ? '' : 'margin-top:50px;'}`}>
                    {!showLoader && (generatedAdvice?.generateHiveAdvice || existingAdvice?.getExistingHiveAdvice) &&
                        <div className={style.message}>
                        {!generatedAdvice && existingAdvice && existingAdvice?.getExistingHiveAdvice &&
                            <div dangerouslySetInnerHTML={{__html: existingAdvice.getExistingHiveAdvice}}/>}
                        {generatedAdvice && generatedAdvice?.generateHiveAdvice &&
                            <div dangerouslySetInnerHTML={{__html: generatedAdvice.generateHiveAdvice}}/>}
                        </div>
                    }
                </div>

            <div style="padding: 16px;text-align:center;min-width:100px;">
                <Button onClick={async () => {
                    setSaving(true)

                    const user = await getUser();
                    const family = await getFamilyByHive(+hiveId);
                    const hive = await getHive(+hiveId);
                    const boxes = await getBoxes({hiveId: +hiveId})
                    let adviceContext = {
                        apiary,
                        hive,
                        family,
                        boxes,
                        frames: {}
                    }
                    for (let i in boxes) {
                        let frames = Object.assign({}, await getFrames({boxId: +boxes[i].id}))
                        delete boxes[i].color

                        for (let j in frames) {
                            if (!frames[j].leftSide || !frames[j].rightSide) continue

                            frames[j].leftSide.cells = await getFrameSideCells(+frames[j].leftId)
                            frames[j].rightSide.cells = await getFrameSideCells(+frames[j].rightId)

                            let leftFile = await getFrameSideFile({frameSideId: +frames[j].leftId})

                            //@ts-ignore
                            frames[j].leftSide.detectedQueenCupsCount = leftFile?.detectedQueenCups.length;
                            //@ts-ignore
                            frames[j].leftSide.isQueenDetected = leftFile?.queenDetected;

                            let rightFile = await getFrameSideFile({frameSideId: +frames[j].rightId})

                            //@ts-ignore
                            frames[j].leftSide.detectedQueenCupsCount = rightFile?.detectedQueenCups.length;
                            //@ts-ignore
                            frames[j].leftSide.isQueenDetected = rightFile?.queenDetected;
                        }

                        adviceContext['frames'][boxes[i].id] = frames
                    }

                    await generateAdvice({
                        hiveID: hiveId,
                        langCode: user.lang,
                        adviceContext
                    })
                    setSaving(false)

                }}>
                    <img src={beekeeperURL} style="width:20px; height: 20px;margin-right: 2px;"/>
                    <T>Review</T></Button>
            </div>
        </div>
    </>
}