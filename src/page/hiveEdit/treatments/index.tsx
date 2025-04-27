import { useState } from "react";

import { useMutation } from "@/api";
import Button from "@/shared/button";
import ErrorMessage from '@/shared/messageError'
import T from "@/shared/translate";
import Loader from "@/shared/loader";
import MessageSuccess from "@/shared/messageSuccess";

import styles from "./styles.module.less";
import TreatmentList from "./treatmentList";
import { getHive, isEditable } from "@/models/hive";
import { useLiveQuery } from "dexie-react-hooks";

export default function Treatments({ hiveId, boxId = null }) {
	const [treating, setTreating] = useState(false)
	const [treatmentType, setTreatmentType] = useState('')
	const [addedMsg, setAddedMsg] = useState('')

	const hive = useLiveQuery(() => getHive(+hiveId), [hiveId]);

	let [addTreatmentMutation, { error }] =
		useMutation(`mutation treatHive($treatment: TreatmentOfHiveInput!) {
	treatHive(treatment: $treatment)
}
`)
	let [addTreatmentBoxMutation, { error: error2 }] =
		useMutation(`mutation treatBox($treatment: TreatmentOfBoxInput!) {
	treatBox(treatment: $treatment)
}
`)

	async function onTreat() {
		setTreating(true)

		if (boxId) {
			await addTreatmentBoxMutation({
				treatment: {
					boxId: +boxId,
					hiveId: +hiveId,
					type: treatmentType,
				}
			})
		} else {
			await addTreatmentMutation({
				treatment: {
					hiveId: +hiveId,
					type: treatmentType,
				}
			})
		}
		setTreatmentType('')
		setAddedMsg('Treatment added')
		setTreating(false)
	}

	return (
		<div className={styles.treatmentList}>
			{addedMsg && <MessageSuccess title={<T>Treatment added</T>} />}
			<ErrorMessage error={error || error2} />

			{treating && <Loader />}
			{!treating && <TreatmentList hiveId={hiveId} boxId={boxId} />}

			{hive && isEditable(hive) && (
				<div style="display:flex;">
					<input
						type="text"
						style="padding:5px 20px; height: 40px; flex-grow:1"
						onChange={(event) => {
							setTreatmentType((event.target as HTMLInputElement)?.value)
						}}
						value={treatmentType}
						placeholder="Apivar, Oxalic acid ..." />

					<Button
						disabled={!treatmentType}
						loading={treating}
						onClick={() => onTreat()}
					><T>Add treatment</T></Button>
				</div>
			)}
		</div>
	)
}