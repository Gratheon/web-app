import { gql, useMutation } from "@/components/api"
import Button from "@/components/shared/button"
import Checkbox from "@/icons/checkbox"
import QueenIcon from "@/icons/queenIcon"
import { setQueenPresense } from '@/components/models/frameSideFile'
import T from "@/components/shared/translate"
import ErrorMessage from '@/components/shared/messageError'

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