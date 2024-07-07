import { gql, useMutation, useQuery } from "@/components/api";
import Button from "@/components/shared/button";
import Loader from "@/components/shared/loader";
import ErrorMsg from "@/components/shared/messageError";

import style from "./style.less"
import { useState } from "react";
import { getUser } from "@/components/models/user";
import { getHive } from "@/components/models/hive";
import { getBoxes } from "@/components/models/boxes";
import { getFamilyByHive } from "@/components/models/family";
import { getFrames } from "@/components/models/frames";
import { getFrameSideCells } from "@/components/models/frameSideCells";
import { getFrameSideFile } from "@/components/models/frameSideFile";
import T from "@/components/shared/translate";

export default function HiveAdvisor({ hiveId, apiary, hive }) {
	let [saving, setSaving] = useState(false);
	let { loading, error: errorGet, data } = useQuery(gql`
		query apiary($hiveID: ID!) {
			getExistingHiveAdvice(hiveID: $hiveID)
		}`, { variables: { hiveID: +hiveId } })

	let [generateAdvice, { error: mutateError, data: data2 }] = useMutation(gql`
mutation generateHiveAdvice($hiveID: ID, $adviceContext: JSON, $langCode: String){
	generateHiveAdvice(hiveID: $hiveID, adviceContext: $adviceContext, langCode: $langCode)
}
`)

	let showLoader = (loading || saving)
	return <div>
		<ErrorMsg error={errorGet || mutateError} />

		<div className={style.wrap}>
			<div style={`flex-grow:1; text-align:center;${data?.getExistingHiveAdvice ? '' : 'margin-top:50px;'}`}>
				{showLoader && <Loader />}

				{!showLoader && <div className={style.message}>
					{!data?.getExistingHiveAdvice && <div><T>Need advice from AI?</T></div>}

					{!data2 && data && data?.getExistingHiveAdvice &&
						<div dangerouslySetInnerHTML={{ __html: data.getExistingHiveAdvice }} />}
					{data2 && data2?.generateHiveAdvice &&
						<div dangerouslySetInnerHTML={{ __html: data2.generateHiveAdvice }} />}
				</div>}
			</div>

			<div style="padding: 16px;text-align:center;min-width:100px;">
				<img src="/assets/beekeeper.png" style="width:60px; height: 60px;" />
				<br />

				<Button onClick={async () => {
					setSaving(true)

					const user = await getUser();
					const family = await getFamilyByHive(+hiveId);
					const hive = await getHive(+hiveId);
					const boxes = await getBoxes({ hiveId: +hiveId })
					let adviceContext = {
						apiary,
						hive,
						family,
						boxes,
						frames: {}
					}
					for (let i in boxes) {
						let frames = Object.assign({}, await getFrames({ boxId: +boxes[i].id }))
						delete boxes[i].color

						for (let j in frames) {
							if (!frames[j].leftSide || !frames[j].rightSide) continue

							frames[j].leftSide.cells = await getFrameSideCells(+frames[j].leftId)
							frames[j].rightSide.cells = await getFrameSideCells(+frames[j].rightId)

							let leftFile = await getFrameSideFile({ frameSideId: +frames[j].leftId })

							//@ts-ignore
							frames[j].leftSide.detectedQueenCupsCount = leftFile?.detectedQueenCups.length;
							//@ts-ignore
							frames[j].leftSide.isQueenDetected = leftFile?.queenDetected;

							let rightFile = await getFrameSideFile({ frameSideId: +frames[j].rightId })

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

				}}><T>Review</T></Button>
			</div>
		</div>
	</div>
}