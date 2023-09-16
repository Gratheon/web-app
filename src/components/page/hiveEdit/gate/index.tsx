import CameraCapture from '@/components/page/hiveEdit/gate/cameraCapture'
import { gql, useQuery } from '@/components/api'
import styles from './styles.less'
import StreamPlayer from './streamPlayer'

export default function Gate({ boxId }) {
	let {
		loading,
		error,
		errorNetwork,
		data,
	} = useQuery(gql`
	query boxStreams($boxIds: [ID]!) {
		videoStreams(boxIds: $boxIds) {
			id
			maxSegment
			playlistURL
			startTime
			endTime
			active
		}
	}
`, { variables: { boxIds: [+boxId] } })

	if (loading) {
		return null
	}
console.log(data)
	if (data.videoStreams?.length > 0) {
		return <div>
			<h2>Streams</h2>
			{data.videoStreams.map((v)=>{
				return <div>{v.startTime}</div>
			})}

			<StreamPlayer playlistURL={data.videoStreams[0].playlistURL} />
		</div>
	}

	return (
		<div className={styles.gateCameraWrap}>
			<div style="background:#0060d6;color:white;padding:10px;">
				Run app from the phone to stream video over good network connection.
				Position it above hive entrance. Use green landing board.
			</div>
			<div style="border:1px solid black;padding:10px;">
				<CameraCapture boxId={boxId} />
			</div>
		</div>
	)
}