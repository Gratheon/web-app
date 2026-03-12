import { useCallback, useEffect, useRef, useState } from 'react'

import { gql, useMutation, useQuery } from '@/api'
import Button from '@/shared/button'
import Loader from '@/shared/loader'
import ErrorMsg from '@/shared/messageError'
import T from '@/shared/translate'

import { getUser } from '@/models/user'
import { getHive } from '@/models/hive'
import { getBoxes } from '@/models/boxes'
import { getFamilyByHive } from '@/models/family'
import { getFrames } from '@/models/frames'
import { getFrameSideCells } from '@/models/frameSideCells'
import { getFrameSideFile } from '@/models/frameSideFile'

import style from './style.module.less'
import beekeeperURL from '@/assets/beekeeper.png'

type HiveAdvisorProps = {
	hiveId: string | number
	apiary: any
	hive: any
	autoAnalyze?: boolean
	showAnalyzeButton?: boolean
}

export default function HiveAdvisor({
	hiveId,
	apiary,
	hive,
	autoAnalyze = false,
	showAnalyzeButton = true,
}: HiveAdvisorProps) {
	const [saving, setSaving] = useState(false)
	const hasAutoAnalyzedRef = useRef(false)
	const numericHiveId = +hiveId

	const {
		loading,
		error: errorGet,
		data: existingAdvice,
	} = useQuery(
		gql`
			query apiary($hiveID: ID!) {
				getExistingHiveAdvice(hiveID: $hiveID)
			}
		`,
		{ variables: { hiveID: numericHiveId } }
	)

	const [generateAdvice, { error: mutateError, data: generatedAdvice }] = useMutation(gql`
		mutation generateHiveAdvice($hiveID: ID, $adviceContext: JSON, $langCode: String) {
			generateHiveAdvice(hiveID: $hiveID, adviceContext: $adviceContext, langCode: $langCode)
		}
	`)

	const runAnalysis = useCallback(async () => {
		setSaving(true)
		try {
			const user = await getUser()
			const family = await getFamilyByHive(numericHiveId)
			const currentHive = await getHive(numericHiveId)
			const boxes = await getBoxes({ hiveId: numericHiveId })
			const adviceContext = {
				apiary,
				hive: currentHive || hive,
				family,
				boxes,
				frames: {},
			}

			for (let i in boxes) {
				const frames = Object.assign({}, await getFrames({ boxId: +boxes[i].id }))
				delete boxes[i].color

				for (let j in frames) {
					if (!frames[j].leftSide || !frames[j].rightSide) continue

					frames[j].leftSide.cells = await getFrameSideCells(+frames[j].leftId)
					frames[j].rightSide.cells = await getFrameSideCells(+frames[j].rightId)
					const leftSide = frames[j].leftSide as any
					const rightSide = frames[j].rightSide as any

					const leftFile = await getFrameSideFile({ frameSideId: +frames[j].leftId })
					leftSide.detectedQueenCupsCount = leftFile?.detectedQueenCups?.length || 0
					leftSide.isQueenDetected = leftFile?.queenDetected || false

					const rightFile = await getFrameSideFile({ frameSideId: +frames[j].rightId })
					rightSide.detectedQueenCupsCount = rightFile?.detectedQueenCups?.length || 0
					rightSide.isQueenDetected = rightFile?.queenDetected || false
				}

				adviceContext.frames[boxes[i].id] = frames
			}

			await generateAdvice({
				hiveID: numericHiveId,
				langCode: user?.lang,
				adviceContext,
			})
		} finally {
			setSaving(false)
		}
	}, [apiary, generateAdvice, hive, numericHiveId])

	useEffect(() => {
		if (!autoAnalyze || hasAutoAnalyzedRef.current) {
			return
		}

		hasAutoAnalyzedRef.current = true
		runAnalysis()
	}, [autoAnalyze, runAnalysis])

	const showLoader = loading || saving

	return (
		<>
			<ErrorMsg error={errorGet || mutateError} />

			<div className={`${style.wrap} ${!showAnalyzeButton ? style.readOnlyWrap : ''}`}>
				{showLoader && <Loader />}

				{showAnalyzeButton && (
					<Button
						style="margin: 0 auto;"
						onClick={runAnalysis}
					>
						<img src={beekeeperURL} style="width:20px; height: 20px;margin-right: 2px;" />
						<T>Analyze with AI</T>
					</Button>
				)}

				<div
					style={`text-align:center;${existingAdvice?.getExistingHiveAdvice ? '' : 'margin-top:50px;'}`}
				>
					{!showLoader &&
						(generatedAdvice?.generateHiveAdvice || existingAdvice?.getExistingHiveAdvice) && (
							<div className={style.message}>
								{!generatedAdvice && existingAdvice?.getExistingHiveAdvice && (
									<div
										dangerouslySetInnerHTML={{ __html: existingAdvice.getExistingHiveAdvice }}
									/>
								)}

								{generatedAdvice?.generateHiveAdvice && (
									<div
										dangerouslySetInnerHTML={{ __html: generatedAdvice.generateHiveAdvice }}
									/>
								)}
							</div>
						)}
				</div>
			</div>
		</>
	)
}
