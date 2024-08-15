import CameraCapture from './cameraCapture';
import { gql, useQuery } from '../../../api';
import styles from './styles.module.less';
import StreamPlayer from './streamPlayer';

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
	if (data?.videoStreams) {
		for (const stream of data.videoStreams) {
			if (stream.active) {
				hasActiveStream = true;
				break;
			}
		}
	}

	const streamStart = !hasActiveStream && (
		<div className={styles.gateCameraWrap}>
			<CameraCapture boxId={boxId} />
		</div>
	);

	return <div>
		{streamStart}

		{data?.videoStreams && data?.videoStreams.length>0 && <div>
			<h3>Past stream playback</h3>
			<StreamPlayer videoStreams={data?.videoStreams} />
		</div>}
	</div>;
}
