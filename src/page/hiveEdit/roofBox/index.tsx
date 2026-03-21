import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useMutation } from '@/api'
import T from '@/shared/translate'
import ErrorMessage from '@/shared/messageError'
import {
	boxTypes,
	getBox,
	normalizeRoofStyle,
	roofStyles,
	updateBox,
} from '@/models/boxes'

import styles from './styles.module.less'

const UPDATE_BOX_ROOF_STYLE_MUTATION = gql`
mutation updateBoxRoofStyle($id: ID!, $roofStyle: RoofStyle!) {
	updateBoxRoofStyle(id: $id, roofStyle: $roofStyle)
}
`

type RoofStyleOption = 'FLAT' | 'ANGULAR'

const OPTIONS: Array<{ value: RoofStyleOption; title: string; subtitle: string }> = [
	{
		value: roofStyles.FLAT,
		title: 'Flat roof',
		subtitle: 'Modern and low profile top cover',
	},
	{
		value: roofStyles.ANGULAR,
		title: 'Angular roof',
		subtitle: 'Traditional triangular top cover',
	},
]

export default function RoofBox({ boxId, hiveId }) {
	const box = useLiveQuery(() => (boxId ? getBox(+boxId) : Promise.resolve(undefined)), [boxId], undefined)
	const [updateBoxRoofStyleMutation, { error }] = useMutation(UPDATE_BOX_ROOF_STYLE_MUTATION)
	const [selectedStyle, setSelectedStyle] = useState<RoofStyleOption>(roofStyles.FLAT)
	const [isSaving, setIsSaving] = useState(false)

	useEffect(() => {
		if (!box || box.type !== boxTypes.ROOF) return
		setSelectedStyle(normalizeRoofStyle(box.roofStyle))
	}, [box?.id, box?.type, box?.roofStyle])

	if (!box || box.type !== boxTypes.ROOF) {
		return null
	}

	const saveRoofStyle = async (nextStyle: RoofStyleOption) => {
		if (isSaving) return
		const normalized = normalizeRoofStyle(nextStyle)
		if (normalized === normalizeRoofStyle(box.roofStyle)) {
			setSelectedStyle(normalized)
			return
		}

		setSelectedStyle(normalized)
		setIsSaving(true)
		const result = await updateBoxRoofStyleMutation({
			id: `${box.id}`,
			roofStyle: normalized,
		})

		if (!result?.error) {
			await updateBox({
				id: +box.id,
				hiveId: box?.hiveId ? +box.hiveId : +hiveId,
				position: box?.position ? +box.position : 0,
				type: box.type,
				color: box.color,
				holeCount: box.holeCount,
				roofStyle: normalized,
			})
		}

		setIsSaving(false)
	}

	return (
		<div className={styles.wrap}>
			<h3>
				<T>Roof style</T>
			</h3>
			<p className={styles.subtitle}>
				<T>Select how this roof should look in hive visualization.</T>
			</p>

			<ErrorMessage error={error} />

			<div className={styles.options} role="radiogroup" aria-label="Roof style">
				{OPTIONS.map((option) => {
					const selected = selectedStyle === option.value
					return (
						<label
							key={option.value}
							className={`${styles.option} ${selected ? styles.selected : ''}`}
						>
							<input
								type="radio"
								name={`roof-style-${box.id}`}
								checked={selected}
								onChange={() => saveRoofStyle(option.value)}
								disabled={isSaving}
							/>
							<span className={styles.preview}>
								<span className={`${styles.previewRoof} ${option.value === roofStyles.ANGULAR ? styles.previewAngular : styles.previewFlat}`}></span>
							</span>
							<span className={styles.textWrap}>
								<strong>{option.title}</strong>
								<span>{option.subtitle}</span>
							</span>
						</label>
					)
				})}
			</div>
		</div>
	)
}
