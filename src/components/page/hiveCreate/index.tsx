import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { gql, useMutation } from '@/components/api'

import VisualForm from '@/components/shared/visualForm'
import HiveIcon from '@/components/shared/hive'
import ErrorMsg from '@/components/shared/messageError'
import VisualFormSubmit from '@/components/shared/visualForm/VisualFormSubmit'
import Button from '@/components/shared/button'
import { Box, boxTypes } from '@/components/models/boxes'
import T from '@/components/shared/translate'
const defaultBoxColor = '#ffc848'

export default function HiveCreateForm() {
	let { id } = useParams()
	let [boxCount, setBoxCount] = useState(2)
	let defaultBoxes = []
	for (let i = 0; i < boxCount; i++) {
		defaultBoxes.push({
			color: `${defaultBoxColor}`,
		})
	}
	defaultBoxes.push({
		type: boxTypes.GATE
	})

	const [boxes, setBoxes] = useState(defaultBoxes)

	let navigate = useNavigate()
	let [frameCount, setFrameCount] = useState(8)
	let [name, setName] = useState('')
	let [addHive, { error, data }] = useMutation(
		gql`
			mutation addHive(
				$name: String!
				$boxCount: Int!
				$frameCount: Int!
				$apiaryId: ID!
				$colors: [String]
			) {
				addHive(
					hive: {
						name: $name
						boxCount: $boxCount
						frameCount: $frameCount
						apiaryId: $apiaryId
						colors: $colors
					}
				) {
					id
					name
					boxCount
				}
			}
		`,
		{ errorPolicy: 'all' }
	)

	async function onSubmit(e) {
		e.preventDefault()

		const result = await addHive({
			apiaryId: id,
			name,
			boxCount,
			frameCount,
			colors: boxes.map((b: Box) => {
				return b.color
			}),
		})

		navigate(`/apiaries/${id}/hives/${result.data.addHive.id}`, { replace: true, state: {
			title: "Hive added successfully",
			message: "Try adding frame photos"
		} })
	}

	return (
		<div>
			{error && <ErrorMsg error={error} />}
			<div style={{ display: 'flex', padding: 20 }}>
				<div style={{ paddingTop: 30, width: 100, textAlign: 'center' }}>
					<HiveIcon boxes={boxes} editable={true} />
				</div>

				<VisualForm onSubmit={onSubmit.bind(this)} style="flex-grow:1">
					<div>
						<label htmlFor="name" style="width:120px;"><T>Name</T></label>
						<input
							name="name"
							id="name"
							style={{ flexGrow: '1' }}
							autoFocus
							value={name}
							onInput={(e: any) => setName(e.target.value)}
						/>
					</div>

					<div>
						<label htmlFor="boxCount"><T>Section count</T></label>

						<input
							style={{ width: 50 }}
							type="number"
							id="boxCount"
							name="boxCount"
							value={boxCount}
							onInput={(e: any) => {
								const boxCount = parseInt(e.target.value, 10)
								if (boxCount < 1) return

								setBoxCount(boxCount)
								if (boxCount > boxes.length) {
									setBoxes([...boxes, { color: defaultBoxColor }])
								} else if (boxCount < boxes.length) {
									setBoxes([...boxes.slice(0, boxCount)])
								}
							}}
							min="1"
							max="10"
							step="1"
						/>
					</div>

					<div>
						<label htmlFor="frameCount"><T>Frame count</T></label>

						<input
							style={{ width: 50 }}
							type="number"
							id="frameCount"
							name="frameCount"
							value={frameCount}
							onInput={(e: any) => setFrameCount(parseInt(e.target.value, 10))}
							min="0"
							max="40"
							step="1"
						/>
					</div>

					<VisualFormSubmit>
						<Button type="submit" color="green"><T>Create</T></Button>
					</VisualFormSubmit>
				</VisualForm>
			</div>
		</div>
	)
}
