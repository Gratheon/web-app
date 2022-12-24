import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'

import { gql, useMutation } from '../../api'

import VisualForm from '../../shared/visualForm'
import HiveIcon from '../../shared/hiveIcon'
import Loader from '../../shared/loader'
import ErrorMsg from '../../shared/messageError'
import VisualFormSubmit from '../../shared/visualForm/VisualFormSubmit'
import Button from '../../shared/button'

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

	const [boxes, setBoxes] = useState(defaultBoxes)

	let navigate = useNavigate()
	let [frameCount, setFrameCount] = useState(8)
	let [name, setName] = useState('')
	let [addHive, { loading, error, data }] = useMutation(
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

	function onSubmit(e) {
		e.preventDefault()

		addHive({
			apiaryId: id,
			name,
			boxCount: parseInt(boxCount, 10),
			frameCount: parseInt(frameCount, 10),
			colors: boxes.map((b) => {
				return b.color
			}),
		})
	}

	if (loading) {
		return <Loader />
	}

	if (data) {
		navigate('/apiaries', { replace: true })

		return <div>Saved!</div>
	}

	return (
		<div>
			{error && <ErrorMsg error={error} />}
			<div style="display:flex;padding:20px;">
				<div style="padding-top:30px;width: 100px;text-align: center;">
					<HiveIcon boxes={boxes} editable={true} />
				</div>

				<VisualForm onSubmit={onSubmit.bind(this)} style="flex-grow:1">
					<div>
						<label htmlFor="name">Name</label>
						<input
							name="name"
							id="name"
							style={{ flexGrow: '1' }}
							autoFocus
							value={name}
							onInput={(e) => setName(e.target.value)}
						/>
					</div>

					<div>
						<label htmlFor="boxCount">Box count</label>

						<input
							style="width:50px;"
							type="number"
							id="boxCount"
							name="boxCount"
							value={boxCount}
							onInput={(e) => {
								if (e.target.value < 1) return

								setBoxCount(e.target.value)
								if (e.target.value > boxes.length) {
									setBoxes([...boxes, { color: defaultBoxColor }])
								} else if (e.target.value < boxes.length) {
									setBoxes([...boxes.slice(0, e.target.value)])
								}
							}}
							min="1"
							max="10"
							steo="1"
						/>
					</div>

					<div>
						<label htmlFor="frameCount">Frame count</label>

						<input
							style="width:50px;"
							type="number"
							id="frameCount"
							name="frameCount"
							value={frameCount}
							onInput={(e) => setFrameCount(e.target.value)}
							min="0"
							max="40"
							steo="1"
						/>
					</div>

					<VisualFormSubmit>
						<Button type="submit" class="green">
							Create
						</Button>
					</VisualFormSubmit>
				</VisualForm>
			</div>
		</div>
	)
}
