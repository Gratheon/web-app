import { useState } from "react"

import { gql, useMutation } from "../../../api"
import CopySuccess from "../../../icons/copySuccess.tsx"
import ShareIcon from "../../../icons/share.tsx"
import Button from "../../../shared/button"
import MessageSuccess from "../../../shared/messageSuccess"
import T from "../../../shared/translate"
import ErrorMsg from "../../../shared/messageError"


export default function InspectionShareButton({
	apiaryId,
	hiveId,
	inspectionId,
}) {
	let [resultUrl, setResultUrl] = useState('')

	// Update mutation definition to use scopeParams
	let [generateToken, { error: generationError }] = useMutation(gql`
		mutation generateShareToken(
			$name: String!,
			$scopes: JSON!,
			$sourceUrl: URL!,
			$scopeParams: JSON! # Use scopeParams
		) {
			generateShareToken(
				name: $name,
				scopes: $scopes,
				sourceUrl: $sourceUrl,
				scopeParams: $scopeParams # Pass scopeParams
			) {
				id
				token
				targetUrl
			}
		}
	`)

	const [generatingToken, setGenerating] = useState(false)

	async function onGenerateToken() {
		setGenerating(true);

		// Construct scopeParams object
		const scopeParamsData = {
			apiaryId: apiaryId,
			hiveId: hiveId,
			inspectionId: inspectionId
		};

		const variablesToSend = {
			name: `Inspection ${inspectionId} share`,
			sourceUrl: window.location.href,
			scopeParams: scopeParamsData, // Pass the IDs within scopeParams
			scopes: { // Construct scopes (can potentially be generated on backend too)
				version: 1,
				allowedQueries: [
					{
						queryName: "inspection",
						requiredArgs: { inspectionId: inspectionId }
					},
					{
						queryName: "hive", // Allow fetching the specific hive
						requiredArgs: { id: hiveId }
					}
					// Note: We don't need to explicitly allow sub-fields like hive.boxes or hive.family.
					// The scope check in graphql-router currently only validates the top-level queryName and its direct arguments.
					// Downstream services (like swarm-api) implicitly handle fetching allowed sub-fields based on the allowed top-level query.
					// We also don't need 'apiary' scope anymore as it's not directly queried by InspectionShare.
				]
			}
			// based on the mutation definition expecting JSON.
		};
		console.log('InspectionShareButton: Calling generateToken with variables:', variablesToSend); // Log variables

		const result = await generateToken(variablesToSend);

		let url = result.data.generateShareToken.targetUrl
		setResultUrl(url)
		navigator.clipboard.writeText(url);

		setGenerating(false);
	}

	if (resultUrl)
		return <MessageSuccess 
			title={<><ShareIcon/> <T>Inspection share URL generated and copied to clipboard</T></>} 
			message={resultUrl} />

	
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
