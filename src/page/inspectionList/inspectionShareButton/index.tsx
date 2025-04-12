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
						queryName: "inspection", // Corresponds to Query.inspection in GraphQL schema
						requiredArgs: { inspectionId: inspectionId } // Use inspectionId (lowercase d) consistent with query
					},
					{
						queryName: "hive", // Corresponds to Query.hive
						requiredArgs: { id: hiveId } // Use id as defined in schema
					},
					{
						queryName: "apiary", // Corresponds to Query.apiary
						requiredArgs: { id: apiaryId } // Use id as defined in schema
					}
					// Note: We are not including frame/frameSide scopes for now,
					// as InspectionView seems to rely on data embedded in the inspection snapshot.
					// Add them here if direct frame/side queries become necessary for the share view.
				]
			}
			// The 'scopes' object will be automatically stringified by the GraphQL client/api layer
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
