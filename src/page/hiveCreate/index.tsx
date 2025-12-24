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
import QueenColor from '@/page/hiveEdit/hiveTopInfo/queenColor'
import { getQueenColorFromYear } from '@/page/hiveEdit/hiveTopInfo/queenColor/utils'

import styles from './styles.module.less'

//@ts-ignore
import GithubPicker from 'react-color/es/Github'


const defaultBoxColor = '#ffc848'

const queenColors = [
	'#fefee3',
	'#ffba08',
	'#f94144',
	'#38b000',
	'#0466c8',
	'#4D4D4D',
	'#999999',
	'#FFFFFF',
	'#F44E3B',
	'#FE9200',
	'#FCDC00',
	'#DBDF00',
	'#A4DD00',
	'#68CCCA',
	'#73D8FF',
	'#AEA1FF',
	'#FDA1FF',
	'#333333',
	'#808080',
	'#cccccc',
	'#D33115',
	'#E27300',
	'#FCC400',
	'#B0BC00',
	'#68BC00',
	'#16A5A5',
	'#009CE0',
	'#7B64FF',
	'#FA28FF',
	'#000000',
	'#666666',
	'#B3B3B3',
	'#9F0500',
	'#C45100',
	'#FB9E00',
	'#808900',
	'#194D33',
	'#0C797D',
	'#0062B1',
	'#653294',
	'#AB149E',
]

const RANDOM_HIVE_NAME_QUERY = gql`
    query RandomHiveName($language: String) { # Add language variable
        randomHiveName(language: $language)
    }
`

export default function HiveCreateForm() {
    let { id } = useParams()
    let [hiveType, setHiveType] = useState('vertical')
    let [boxCount, setBoxCount] = useState(1)
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
    let [frameCount, setFrameCount] = useState(10)
    let [name, setName] = useState('')
    let [queenYear, setQueenYear] = useState(new Date().getFullYear().toString())
    let [queenColor, setQueenColor] = useState<string | null>(null)
    let [hiveNumber, setHiveNumber] = useState<number | undefined>(undefined)
    const [lang, setLang] = useState('en')
    const [showColorPicker, setShowColorPicker] = useState(false)
    let user = useLiveQuery(() => getUser(), [], null)

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
            if (SUPPORTED_LANGUAGES.includes(browserLang)) {
                lang = browserLang;
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
				$queenName: String
				$queenYear: String
				$queenColor: String
				$hiveNumber: Int
				$boxCount: Int!
				$frameCount: Int!
				$apiaryId: ID!
				$colors: [String]
			) {
				addHive(
					hive: {
						queenName: $queenName
						queenYear: $queenYear
						queenColor: $queenColor
						hiveNumber: $hiveNumber
						boxCount: $boxCount
						frameCount: $frameCount
						apiaryId: $apiaryId
						colors: $colors
					}
				) {
					id
					hiveNumber
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
            updateHiveDimensions(1, 10);
        } else if (newHiveType === 'horizontal') {
            updateHiveDimensions(1, 20);
        }
    };

    async function onSubmit(e) {
        e.preventDefault()

        const result = await addHive({
            apiaryId: id,
            queenName: name || undefined,
            queenYear: queenYear || undefined,
            queenColor: queenColor || undefined,
            hiveNumber: hiveNumber || undefined,
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
                <div style={{ padding: 20 }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <HiveIcon boxes={boxes} editable={true} />
                    </div>

                    <VisualForm
                        onSubmit={onSubmit.bind(this)}
                        submit={<Button type="submit" color="green"><T>Install</T></Button>}>
                        <div className={styles.formField}>
                            <label className={styles.formLabel}><T>Hive Type</T></label>
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

                        <div className={styles.formField}>
                            <label htmlFor="hiveNumber" className={styles.formLabel}><T>Hive Number</T></label>
                            <input
                                className={styles.smallInput}
                                type="number"
                                id="hiveNumber"
                                name="hiveNumber"
                                value={hiveNumber || ''}
                                onInput={(e: any) => {
                                    const val = e.target.value;
                                    setHiveNumber(val ? parseInt(val, 10) : undefined);
                                }}
                                min="1"
                                step="1"
                            />
                        </div>

                        <div className={styles.formField}>
                            <label htmlFor="name" className={styles.formLabel}><T>Queen Name</T></label>
                            <div className={styles.flexRow}>
                                <input
                                    name="name"
                                    id="name"
                                    className={styles.flexInput}
                                    autoFocus
                                    value={name}
                                    onInput={(e: any) => setName(e.target.value)}
                                />
                                <Button
                                    type="button"
                                    iconOnly={true}
                                    onClick={handleRefreshName}
                                    disabled={randomNameLoading}
                                    style={{
                                        height: '32px',
                                        borderRadius: '5px',
                                        padding: '0 8px',
                                    }}
                                    title="Get new name suggestion"
                                >
                                    <RefreshIcon />
                                </Button>
                            </div>
                        </div>

                        <div className={styles.formField}>
                            <label className={styles.formLabel}><T>Queen Year</T></label>
                            <div className={styles.yearColorRow}>
                                <input
                                    className={styles.smallInput}
                                    type="text"
                                    id="queenYear"
                                    name="queenYear"
                                    value={queenYear}
                                    onInput={(e: any) => {
                                        setQueenYear(e.target.value);
                                        setQueenColor(null);
                                    }}
                                    placeholder="YYYY"
                                    maxLength={4}
                                />
                                <div className={styles.colorPickerWrapper}>
                                    <div
                                        className={styles.colorDisplay}
                                        onClick={() => setShowColorPicker(!showColorPicker)}
                                    >
                                        <QueenColor year={queenYear} color={queenColor} />
                                    </div>
                                    {showColorPicker && (
                                        <>
                                            <div
                                                className={styles.colorPickerOverlay}
                                                onClick={() => setShowColorPicker(false)}
                                            />
                                            <div className={styles.colorPickerPopup}>
                                                <GithubPicker
                                                    width={212}
                                                    colors={queenColors}
                                                    onChangeComplete={(c: any) => {
                                                        setQueenColor(c.hex);
                                                        setShowColorPicker(false);
                                                    }}
                                                    color={queenColor || getQueenColorFromYear(queenYear)}
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles.formField}>
                            <label htmlFor="boxCount" className={styles.formLabel}><T>Section count</T></label>
                            <input
                                className={styles.smallInput}
                                type="number"
                                id="boxCount"
                                name="boxCount"
                                value={boxCount}
                                onInput={(e: any) => {
                                    const newBoxCount = parseInt(e.target.value, 10);
                                    if (newBoxCount < 1 || newBoxCount > 6) return;
                                    updateHiveDimensions(newBoxCount, frameCount);
                                }}
                                min="1"
                                max="6"
                                step="1"
                            />
                        </div>

                        <div className={styles.formField}>
                            <label htmlFor="frameCount" className={styles.formLabel}><T>Frame count</T></label>
                            <input
                                className={styles.smallInput}
                                type="number"
                                id="frameCount"
                                name="frameCount"
                                value={frameCount}
                                onInput={(e: any) => {
                                    setFrameCount(parseInt(e.target.value, 10))
                                }}
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
