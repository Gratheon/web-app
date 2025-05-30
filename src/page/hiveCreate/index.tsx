import { useState, useEffect, useCallback } from 'react' // Add useCallback
import { useNavigate } from 'react-router'
import { useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'

import { gql, useMutation, useQuery } from '@/api'
import { getUser } from '@/models/user' // Import getUser

import VisualForm from '@/shared/visualForm'
import HiveIcon from '@/shared/hive'
import ErrorMsg from '@/shared/messageError'
import Button from '@/shared/button'
import T from '@/shared/translate'
import RefreshIcon from '@/icons/RefreshIcon' // Import the new icon component

import { Box, boxTypes } from '@/models/boxes'
import PagePaddedCentered from '@/shared/pagePaddedCentered'
import Card from '@/shared/pagePaddedCentered/card'


const defaultBoxColor = '#ffc848'
const supportedLangs = ['en', 'ru', 'et', 'tr', 'pl', 'de', 'fr']; // Define supported languages

const RANDOM_HIVE_NAME_QUERY = gql`
    query RandomHiveName($language: String) { # Add language variable
        randomHiveName(language: $language)
    }
`

export default function HiveCreateForm() {
    let { id } = useParams()
    let [hiveType, setHiveType] = useState('vertical') // Add state for hive type
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
    let [frameCount, setFrameCount] = useState(10) // Default frame count for vertical
    let [name, setName] = useState('')
    const [lang, setLang] = useState('en'); // State for language code
    let user = useLiveQuery(() => getUser(), [], null) // Get user data

    const updateHiveDimensions = (newBoxCount, newFrameCount) => {
        setBoxCount(newBoxCount);
        setFrameCount(newFrameCount);
        const updatedBoxes = [];
        for (let i = 0; i < newBoxCount; i++) {
            updatedBoxes.push({
                color: `${defaultBoxColor}`,
            });
        }
        updatedBoxes.push({
            type: boxTypes.GATE
        });
        setBoxes(updatedBoxes);
    };

    // Determine language code
    useEffect(() => {
        let currentLang = 'en'; // Default
        if (user && user?.lang) {
            currentLang = user.lang;
        } else if (user === null) { // Only check browser if user data is loaded and null
            const browserLang = navigator.language.substring(0, 2);
            if (supportedLangs.includes(browserLang)) {
                currentLang = browserLang;
            }
        }
        setLang(currentLang);
    }, [user]); // Re-run if user data changes

    // Fetch random hive name with language
    const { data: randomNameData, loading: randomNameLoading, reexecuteQuery: reexecuteRandomNameQuery } = useQuery( // Get reexecuteQuery function
        RANDOM_HIVE_NAME_QUERY,
        { variables: { language: lang } } // Pass language variable
    )

    // Set name when query returns (initial load or refetch)
    useEffect(() => {
        // Ensure loading is false before setting name
        if (randomNameData?.randomHiveName && !randomNameLoading) {
            setName(randomNameData.randomHiveName)
        }
        // Depend on randomNameData and randomNameLoading to re-run when data arrives
    }, [randomNameData, randomNameLoading]) // Removed name dependency

    const handleRefreshName = useCallback(() => {
        // Re-execute the query, ensuring it hits the network
        reexecuteRandomNameQuery({ requestPolicy: 'network-only' });
    }, [reexecuteRandomNameQuery]);


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

    const handleHiveTypeChange = (event) => {
        const newHiveType = event.target.value;
        setHiveType(newHiveType);
        if (newHiveType === 'vertical') {
            updateHiveDimensions(2, 10);
        } else if (newHiveType === 'horizontal') {
            updateHiveDimensions(1, 20);
        }
    };

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
        <PagePaddedCentered>
            <h1><T>New Hive</T></h1>
            {error && <ErrorMsg error={error} />}
            <Card>
                <div style={{ display: 'flex', padding: 20 }}>
                    <div style={{ paddingTop: 30, width: 100, textAlign: 'center' }}>
                        <HiveIcon boxes={boxes} editable={true} />
                    </div>

                    <VisualForm
                        onSubmit={onSubmit.bind(this)}
                        style="flex-grow:1"
                        submit={<Button type="submit" color="green"><T>Install</T></Button>}>
                        {/* Hive Type Radio Buttons */}
                        <div>
                            <label><T>Hive Type</T></label>
                            <div>
                                <label>
                                    <input
                                        type="radio"
                                        value="vertical"
                                        checked={hiveType === 'vertical'}
                                        onChange={handleHiveTypeChange}
                                    />
                                    <T>Vertical</T>
                                </label>
                                <label style={{ marginLeft: '10px' }}>
                                    <input
                                        type="radio"
                                        value="horizontal"
                                        checked={hiveType === 'horizontal'}
                                        onChange={handleHiveTypeChange}
                                    />
                                    <T>Horizontal</T>
                                </label>
                            </div>
                        </div>

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
                            <Button
                                type="button" // Explicitly set type
                                iconOnly={true} // Use iconOnly style
                                onClick={handleRefreshName}
                                disabled={randomNameLoading}
                                style={{ // Apply matching styles
                                    height: '32px',
                                    borderRadius: '5px',
                                    padding: '0 8px', // Adjust padding for icon
                                    marginLeft: '5px', // Add some space
                                    verticalAlign: 'middle' // Align vertically
                                }}
                                title="Get new name suggestion"
                            >
                                <RefreshIcon /> {/* Use the component */}
                            </Button>
                        </div>

                        <div>
                            <label htmlFor="boxCount"><T>Section count</T></label>

                            <input
                                style={{ width: 60 }}
                                type="number"
                                id="boxCount"
                                name="boxCount"
                                value={boxCount}
                                onInput={(e: any) => {
                                    const newBoxCount = parseInt(e.target.value, 10);
                                    if (newBoxCount < 1 || newBoxCount > 6) return;
                                    // Keep the current frameCount when boxCount is changed manually
                                    updateHiveDimensions(newBoxCount, frameCount);
                                }}
                                min="1"
                                max="6"
                                step="1"
                            />
                        </div>

                        <div>
                            <label htmlFor="frameCount"><T>Frame count</T></label>

                            <input
                                style={{ width: 60 }}
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
                    </VisualForm>
                </div>
            </Card>
        </PagePaddedCentered>
    )
}
