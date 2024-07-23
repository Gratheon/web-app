import { useState } from "react"

import { gql, useMutation } from "@/components/api"
import CopySuccess from "@/components/icons/copySuccess"
import ShareIcon from "@/components/icons/share"
import Button from "@/components/shared/button"
import MessageSuccess from "@/components/shared/messageSuccess"
import T from "@/components/shared/translate"
import ErrorMsg from "@/components/shared/messageError"


export default function InspectionShare({
	apiaryId,
	hiveId,
	inspectionId,
}) {
	let [resultUrl, setResultUrl] = useState('')

	let [generateToken, { error: generationError }] = useMutation(gql`
		mutation generateShareToken($name: String!, $scopes: JSON!, $sourceUrl: URL!) {
			generateShareToken(name: $name, scopes: $scopes, sourceUrl: $sourceUrl) {
				id
				token
				targetUrl
			}
		}
	`)

	const [generatingToken, setGenerating] = useState(false)

	async function onGenerateToken() {
		setGenerating(true);

		const result = await generateToken({
			name: `Inspection ${inspectionId} share`,
			sourceUrl: window.location.href,
			scopes: JSON.stringify({
				'Query.inspection': {
					'args': {
						apiaryId,
						hiveId,
						inspectionId,
					}
				}
			})
		})
		
		let url = result.data.generateShareToken.targetUrl
		setResultUrl(url)
		navigator.clipboard.writeText(url);

		setGenerating(false);
	}

	if (resultUrl)
		return <MessageSuccess title={<T>Inspection share URL generated and copied to clipboard</T>} message={resultUrl} />

	
	return <>
		<ErrorMsg error={generationError} />
		<div style="display:flex;margin:10px;padding:10px 15px;max-width:600px;border: 1px solid gray; border-radius:5px;box-sizing:border;">

			{!resultUrl && <p>
				You can share access to this beehive inspection with others.
				They will be able to view the data but not make any changes.
				You can revoke this URL from account settings at any time.
			</p>}


			<Button style="vertical-align:middle;margin-left:10px;"
				loading={generatingToken}
				onClick={onGenerateToken}>

				{resultUrl && <><CopySuccess /> Generated</>}
				{!resultUrl && <>
					<ShareIcon />
					<T ctx="This is a button that shares access of current beehive state in read-only mode">Share</T>
				</>}
			</Button>
		</div>
	</>
}