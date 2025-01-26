import {useState} from 'react'
import {useNavigate} from 'react-router'
import {useParams} from 'react-router-dom'

import {gql, useMutation} from '@/api'

import VisualForm from '@/shared/visualForm'
import HiveIcon from '@/shared/hive'
import ErrorMsg from '@/shared/messageError'
import VisualFormSubmit from '@/shared/visualForm/VisualFormSubmit'
import Button from '@/shared/button'
import T from '@/shared/translate'

import {Box, boxTypes} from '@/models/boxes'


const defaultBoxColor = '#ffc848'

export default function HiveCreateForm() {
    let {id} = useParams()
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
    let [addHive, {error, data}] = useMutation(
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
        {errorPolicy: 'all'}
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

        navigate(`/apiaries/${id}/hives/${result.data.addHive.id}`, {
            replace: true, state: {
                title: "Hive added successfully",
                message: "Try adding frame photos"
            }
        })
    }

    return (
        <div>
            {error && <ErrorMsg error={error}/>}
            <div style={{display: 'flex', padding: 20}}>
                <div style={{paddingTop: 30, width: 100, textAlign: 'center'}}>
                    <HiveIcon boxes={boxes} editable={true}/>
                </div>

                <VisualForm onSubmit={onSubmit.bind(this)} style="flex-grow:1">
                    <div>
                        <label htmlFor="name" style="width:120px;"><T>Name</T></label>
                        <input
                            name="name"
                            id="name"
                            style={{flexGrow: '1'}}
                            autoFocus
                            value={name}
                            onInput={(e: any) => setName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label htmlFor="boxCount"><T>Section count</T></label>

                        <input
                            style={{width: 60}}
                            type="number"
                            id="boxCount"
                            name="boxCount"
                            value={boxCount}
                            onInput={(e: any) => {
                                const boxCount = parseInt(e.target.value, 10)
                                if (boxCount < 1) return
                                if (boxCount > 6) return

                                setBoxCount(boxCount)
                                if (boxCount > boxes.length) {
                                    setBoxes([{color: defaultBoxColor}, ...boxes])
                                } else if (boxCount < boxes.length) {
                                    setBoxes([...boxes.slice(0, boxCount)])
                                }
                            }}
                            min="1"
                            max="6"
                            step="1"
                        />
                    </div>

                    <div>
                        <label htmlFor="frameCount"><T>Frame count</T></label>

                        <input
                            style={{width: 60}}
                            type="number"
                            id="frameCount"
                            name="frameCount"
                            value={frameCount}
                            onInput={(e: any) => {
                                setFrameCount(parseInt(e.target.value, 10))
                            }
                            }
                            min="0"
                            max="25"
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
