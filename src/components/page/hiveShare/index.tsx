import Button from "@/components/shared/button"
import T from "@/components/shared/translate"
import { useState } from "react"

function onShare() {

}

export default function HiveShare() {
	let [creatingShare, setCreatingShare] = useState(false)

	return <div>
		aaa
		<Button loading={creatingShare} onClick={onShare}>
			<T ctx="This is a button that shares access of current beehive state in read-only mode">Share</T>
		</Button>
	</div>
}