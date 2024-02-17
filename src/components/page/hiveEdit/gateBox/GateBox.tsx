import CameraCapture from '@/components/page/hiveEdit/gateBox/cameraCapture';
import { gql, useQuery } from '@/components/api';
import styles from './styles.less';
import StreamPlayer from './streamPlayer';
import CalendarSelector from '@/components/page/hiveEdit/gateBox/calendarSelector';
import Button from '@/components/shared/button';

export default function GateBox({ boxId }) {
	let {
		loading, error, errorNetwork, data,
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
`, { variables: { boxIds: [+boxId] } });

	if (loading) {
		return null;
	}

	// find active stream
	let hasActiveStream = false;
	for (const stream of data.videoStreams) {
		if (stream.active) {
			hasActiveStream = true;
			break;
		}
	}

	const streamStart = !hasActiveStream && (
		<div className={styles.gateCameraWrap}>
			<div style="border:1px solid black;padding:10px;">
				<CameraCapture boxId={boxId} />
			</div>
		</div>
	);

	console.log(data.videoStreams)

	return <div>
		{streamStart}

		{/* <CalendarSelector /> */}

		<StreamPlayer videoStreams={data.videoStreams} />
	</div>;
}
