import { gql, useMutation } from "../../../../api"
import Button from "../../../../shared/button"
import Checkbox from "../../../../icons/checkbox.tsx"
import QueenIcon from "../../../../icons/queenIcon.tsx"
import { setQueenPresense } from '../../../../models/frameSideFile.ts'
import T from "../../../../shared/translate"
import ErrorMessage from '../../../../shared/messageError'

export default function QueenButton({
	frameSideFile,
	frameSide
}) {

	// Queen button
	let [mutateQueenPresense, { error: errorFrameSide }] = useMutation(gql`mutation updateFrameSideQueenPresense($frameSideId: ID!, $isPresent: Boolean!) {
		updateFrameSideQueenPresense(frameSideId: $frameSideId, isPresent: $isPresent) 
		}`)

	async function onQueenToggle() {
		await mutateQueenPresense({
			frameSideId: frameSide.id,
			isPresent: !frameSideFile.queenDetected,
		})
		await setQueenPresense(frameSideFile, !frameSideFile.queenDetected)
	}

	return <>
				<ErrorMessage error={errorFrameSide} />

				<Button title="Toggle queen" onClick={onQueenToggle}>
					<Checkbox on={frameSideFile.queenDetected} />
					<span><T ctx="this is a button that toggles visibility of bee queen on an image">Queen</T></span>
					<QueenIcon size={14} color={'white'} />
				</Button>
			</>

}